import { turnstileRejectedMessage } from "./turnstile-public";

/** Cloudflare's documented always-pass secret. Used only when the real secret is unset. */
export const turnstileTestSecret = "1x0000000000000000000000000000000AA";

export { turnstileRejectedMessage };

const siteverifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const maxTokenLength = 2048;

/**
 * Production (VERCEL_ENV=production) fails closed when the secret is missing.
 * Local dev and preview keep Cloudflare's test secret so the widget still runs
 * without a real key. A blank secret is treated as missing.
 */
export function turnstileSecret() {
  const configured = process.env.TURNSTILE_SECRET_KEY?.trim() || "";
  if (configured) return configured;
  if (process.env.VERCEL_ENV === "production") return "";
  return turnstileTestSecret;
}

/** First public address from the proxy headers. Empty when the request has none. */
export function turnstileVisitorIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const real = request.headers.get("x-real-ip")?.trim() || "";
  const candidate = forwarded || real;
  if (!candidate || candidate.toLowerCase() === "unknown" || candidate === "local") return "";
  return candidate;
}

export async function verifyTurnstile(token: unknown, remoteip: string) {
  if (typeof token !== "string" || token.length === 0 || token.length > maxTokenLength) return false;
  const secret = turnstileSecret();
  if (!secret) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteip) body.set("remoteip", remoteip);
    const response = await fetch(siteverifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
