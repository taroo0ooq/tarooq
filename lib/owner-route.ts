import { deskContext } from "./desk-context";
import { readConnection } from "./linkedin-connection";
import {
  clearLinkedInClaim,
  createOwnerPost,
  deleteOwnerPost,
  recordLinkedIn,
  retryLinkedIn,
  updateOwnerPost,
} from "./owner-actions";
import { ownerDenied, readOwnerMutation, requireOwner } from "./owner-http";
import { PostInputError } from "./post-draft";
import { toOwnerPost } from "./post-view";
import { postsJson } from "./posts-http";
import { rateLimit } from "./rate-limit";
import { redactSecrets } from "./secrets";
import { postsDbFromEnv } from "./supabase-posts";

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
