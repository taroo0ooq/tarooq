/**
 * The site had no content security policy. These directives name the hosts the
 * pages already use, plus Cloudflare Turnstile. Unlisted directive types stay open.
 */
export function contentSecurityPolicy() {
  const scriptSrc = ["'self'", "'unsafe-inline'", "https://va.vercel-scripts.com", "https://challenges.cloudflare.com"];
  const frameSrc = ["https://challenges.cloudflare.com", "https://www.linkedin.com"];
  return `script-src ${scriptSrc.join(" ")}; frame-src ${frameSrc.join(" ")}`;
}
