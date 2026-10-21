import { createHash } from "node:crypto";
import { draftFromFormData, draftFromJson, type PostDraft } from "./post-publish";
import { PostInputError } from "./post-draft";
import { createOwnerPost } from "./owner-actions";
import { rateLimit } from "./rate-limit";
import { redactSecrets } from "./secrets";
import { postsDbFromEnv } from "./supabase-posts";
import { tokensMatch } from "./linkedin";

export function postsJson(status: number, body: unknown, retryAfter = 0) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
  });
  if (retryAfter > 0) headers.set("Retry-After", String(retryAfter));
  return new Response(JSON.stringify(body), { status, headers });
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export function authorizePostsApi(request: Request) {
  const expected = process.env.POSTS_API_TOKEN ?? "";
  if (!expected) return { ok: false as const, status: 503, error: "POSTS_API_TOKEN is not set." };
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  const provided = match?.[1] || "\0";
  if (!tokensMatch(provided, expected)) return { ok: false as const, status: 401, error: "Unauthorized." };
  const key = createHash("sha256").update(provided).digest("hex").slice(0, 16);
  return { ok: true as const, key };
}

export async function readDraftRequest(request: Request): Promise<PostDraft> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 6 * 1024 * 1024) throw new PostInputError("Request is too large.", 413);
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      throw new PostInputError("Expected JSON.");
    }
    return draftFromJson(payload);
  }
  if (type.includes("multipart/form-data") || type.includes("application/x-www-form-urlencoded")) {
    return draftFromFormData(await request.formData());
  }
  throw new PostInputError("Use JSON or multipart form data.", 415);
}

export async function publishHttp(draft: PostDraft, rateKey: string) {
  const limited = rateLimit(`publish:${rateKey}`, 8, 10 * 60 * 1000);
  if (!limited.ok) return postsJson(429, { error: "Too many posts. Try again later." }, limited.retryAfter);
  const db = postsDbFromEnv();
  if (!db) return postsJson(503, { error: "Supabase is not configured." });
  try {
    const { deskContext } = await import("./desk-context");
    const result = await createOwnerPost(db, { ...draft, intent: draft.intent || "publish" }, deskContext());
    return postsJson(201, {
      slug: result.post.slug,
      url: result.url,
      status: result.post.status,
      linkedinStatus: result.post.linkedinStatus,
      linkedinUrl: result.post.linkedinUrl,
      note: result.note,
      warning: result.warning,
    });
  } catch (error) {
    if (error instanceof PostInputError) return postsJson(error.status, { error: redactSecrets(error.message) });
    const message = redactSecrets(error instanceof Error ? error.message : "Could not publish the post.");
    return postsJson(500, { error: message });
  }
}
