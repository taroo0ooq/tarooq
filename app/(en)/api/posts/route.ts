import { PostInputError } from "@/lib/post-draft";
import { authorizePostsApi, clientIp, postsJson, publishHttp, readDraftRequest } from "@/lib/posts-http";
import { rateLimit } from "@/lib/rate-limit";
import { redactSecrets } from "@/lib/secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = authorizePostsApi(request);
  if (!auth.ok) {
    if (auth.status === 401) {
      const limited = rateLimit(`auth:${clientIp(request)}`, 30, 10 * 60 * 1000);
      if (!limited.ok) return postsJson(429, { error: "Too many attempts." }, limited.retryAfter);
    }
    return postsJson(auth.status, { error: auth.error });
  }
  try {
    const draft = await readDraftRequest(request);
    return publishHttp(draft, auth.key);
  } catch (error) {
    if (error instanceof PostInputError) return postsJson(error.status, { error: redactSecrets(error.message) });
    return postsJson(400, { error: "Could not read the post." });
  }
}
