import { OWNER_COOKIE, openOwnerSession } from "@/lib/owner-session";
import { PostInputError } from "@/lib/post-draft";
import { postsJson, publishHttp, readDraftRequest } from "@/lib/posts-http";
import { redactSecrets } from "@/lib/secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export async function POST(request: Request) {
  const session = openOwnerSession(readCookie(request, OWNER_COOKIE));
  if (!session) return postsJson(401, { error: "Sign in again." });
  try {
    const draft = await readDraftRequest(request);
    return publishHttp(draft, `owner:${session.personId}`);
  } catch (error) {
    if (error instanceof PostInputError) return postsJson(error.status, { error: redactSecrets(error.message) });
    return postsJson(400, { error: "Could not read the post." });
  }
}
