import { deskContext } from "./desk-context";
import { readConnection } from "./linkedin-connection";
import { testLinkedInDocumentUpload } from "./linkedin-document-test";
import { LinkedInPublishError } from "./linkedin-publish";
import {
  clearLinkedInClaim,
  createOwnerPost,
  deleteOwnerPost,
  recordLinkedIn,
  retryLinkedIn,
  updateOwnerPost,
} from "./owner-actions";
import { ownerDenied, readOwnerMutation, requireOwner } from "./owner-http";
import { assertDocumentUploadRequest, newDocumentPath } from "./post-document";
import { PostInputError } from "./post-draft";
import { toOwnerPost } from "./post-view";
import { postsJson } from "./posts-http";
import { rateLimit } from "./rate-limit";
import { redactSecrets } from "./secrets";
import { postsDbFromEnv } from "./supabase-posts";
import { turnstileRejectedMessage, turnstileVisitorIp, verifyTurnstile } from "./turnstile";

function failure(error: unknown) {
  if (error instanceof PostInputError) return postsJson(error.status, { error: redactSecrets(error.message) });
  const message = redactSecrets(error instanceof Error ? error.message : "Could not save the post.");
  return postsJson(500, { error: message });
}

export async function listOwnerPosts() {
  const db = postsDbFromEnv();
  if (!db) return { posts: [], linkedin: { connected: false, expired: false, unreadable: false, expiresAt: null, name: "" }, error: "Supabase is not configured." };
  const rows = await db.list();
  const url = process.env.SUPABASE_URL || "";
  return {
    posts: rows.map((row) => toOwnerPost(row, url)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    linkedin: await readConnection(db),
    error: "",
  };
}

export async function getOwnerPosts(request: Request) {
  if (!requireOwner(request)) return ownerDenied();
  try {
    return postsJson(200, await listOwnerPosts());
  } catch (error) {
    return failure(error);
  }
}

export async function mutateOwnerPost(request: Request, slug?: string) {
  const session = requireOwner(request);
  if (!session) return ownerDenied();
  const db = postsDbFromEnv();
  if (!db) return postsJson(503, { error: "Supabase is not configured." });
  try {
    const mutation = await readOwnerMutation(request);
    const intent = mutation.kind === "special" ? mutation.intent : mutation.draft.intent;
    const limit = intent === "publish" || intent === "schedule" ? 8 : 40;
    const limited = rateLimit(`owner:${session.personId}:${intent}`, limit, 10 * 60 * 1000);
    if (!limited.ok) return postsJson(429, { error: "Too many changes. Try again later." }, limited.retryAfter);
    const ctx = deskContext();
    if (mutation.kind === "special") {
      if (!slug) return postsJson(404, { error: "Post not found." });
      if (mutation.intent === "retry-linkedin") return postsJson(200, await retryLinkedIn(db, slug, ctx));
      if (mutation.intent === "clear-linkedin") return postsJson(200, await clearLinkedInClaim(db, slug, ctx));
      return postsJson(200, await recordLinkedIn(db, slug, mutation.linkedinUrn, ctx));
    }
    if (!slug) return postsJson(201, await createOwnerPost(db, mutation.draft, ctx));
    return postsJson(200, await updateOwnerPost(db, slug, mutation.draft, ctx));
  } catch (error) {
    return failure(error);
  }
}

export async function createOwnerDocumentUpload(request: Request) {
  const session = requireOwner(request);
  if (!session) return ownerDenied();
  const db = postsDbFromEnv();
  if (!db) return postsJson(503, { error: "Supabase is not configured." });
  const limited = rateLimit(`owner:${session.personId}:document`, 30, 10 * 60 * 1000);
  if (!limited.ok) return postsJson(429, { error: "Too many uploads. Try again later." }, limited.retryAfter);
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return postsJson(400, { error: "Expected JSON." });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return postsJson(400, { error: "Expected a JSON object." });
  const record = payload as Record<string, unknown>;
  const allowed = await verifyTurnstile(record.turnstileToken, turnstileVisitorIp(request));
  if (!allowed) return postsJson(400, { error: turnstileRejectedMessage });
  try {
    assertDocumentUploadRequest({
      size: typeof record.size === "number" ? record.size : Number(record.size),
      contentType: typeof record.contentType === "string" ? record.contentType : "",
    });
    return postsJson(200, await db.createDocumentUpload(newDocumentPath()));
  } catch (error) {
    return failure(error);
  }
}

export async function testOwnerLinkedInDocument(request: Request) {
  const session = requireOwner(request);
  if (!session) return ownerDenied();
  const db = postsDbFromEnv();
  if (!db) return postsJson(503, { error: "Supabase is not configured." });
  const limited = rateLimit(`owner:${session.personId}:linkedin-document-test`, 4, 60 * 60 * 1000);
  if (!limited.ok) return postsJson(429, { error: "Too many upload tests. Try again later." }, limited.retryAfter);
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return postsJson(400, { error: "Expected JSON." });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return postsJson(400, { error: "Expected a JSON object." });
  const documentPath = (payload as Record<string, unknown>).documentPath;
  if (typeof documentPath !== "string") return postsJson(400, { error: "Expected a document path." });
  try {
    const result = await testLinkedInDocumentUpload({ db, documentPath });
    return postsJson(200, result);
  } catch (error) {
    if (error instanceof LinkedInPublishError) {
      const status = error.status >= 400 && error.status <= 599 ? error.status : 502;
      return postsJson(status, { error: redactSecrets(error.message) });
    }
    return failure(error);
  }
}

export async function removeOwnerPost(request: Request, slug: string) {
  const session = requireOwner(request);
  if (!session) return ownerDenied();
  const db = postsDbFromEnv();
  if (!db) return postsJson(503, { error: "Supabase is not configured." });
  const limited = rateLimit(`owner:${session.personId}:delete`, 20, 10 * 60 * 1000);
  if (!limited.ok) return postsJson(429, { error: "Too many changes. Try again later." }, limited.retryAfter);
  try {
    return postsJson(200, await deleteOwnerPost(db, slug, deskContext()));
  } catch (error) {
    return failure(error);
  }
}
