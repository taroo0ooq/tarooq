/** Cloudflare's documented always-pass widget key. Not a production secret. */
export const turnstileTestSiteKey = "1x00000000000000000000AA";

export const turnstileRejectedMessage = "The check didn't go through. Try again.";

export function turnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || turnstileTestSiteKey;
}
