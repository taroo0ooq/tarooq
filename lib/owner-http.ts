import { OWNER_COOKIE, openOwnerSession } from "./owner-session";
import { PostInputError } from "./post-draft";
import { draftFromFormData, draftFromJson, type SaveIntent } from "./post-publish";
import { postsJson } from "./posts-http";

const specialIntents = new Set(["retry-linkedin", "clear-linkedin", "record-linkedin"]);

export function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export function requireOwner(request: Request) {
  return openOwnerSession(readCookie(request, OWNER_COOKIE));
}

export function ownerDenied() {
  return postsJson(401, { error: "Sign in again." });
}

export async function readOwnerMutation(request: Request) {
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
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new PostInputError("Expected a JSON object.");
    const record = payload as Record<string, unknown>;
    const intent = typeof record.intent === "string" ? record.intent : "";
    if (specialIntents.has(intent)) {
      return {
        kind: "special" as const,
        intent: intent as SaveIntent | "retry-linkedin" | "clear-linkedin" | "record-linkedin",
        linkedinUrn: typeof record.linkedinUrn === "string" ? record.linkedinUrn : "",
      };
    }
    return { kind: "draft" as const, draft: draftFromJson(payload) };
  }
  if (type.includes("multipart/form-data") || type.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    const intent = String(form.get("intent") ?? "");
    if (specialIntents.has(intent)) {
      return {
        kind: "special" as const,
        intent: intent as "retry-linkedin" | "clear-linkedin" | "record-linkedin",
        linkedinUrn: String(form.get("linkedinUrn") ?? ""),
      };
    }
    return { kind: "draft" as const, draft: await draftFromFormData(form) };
  }
  throw new PostInputError("Use JSON or multipart form data.", 415);
}
