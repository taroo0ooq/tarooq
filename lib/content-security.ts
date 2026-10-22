/**
 * The site names the hosts the pages already use, plus Cloudflare Turnstile and
 * Cloudflare Web Analytics. Unlisted directive types stay open.
 */
export function contentSecurityPolicy() {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://va.vercel-scripts.com",
    "https://challenges.cloudflare.com",
    "https://static.cloudflareinsights.com",
  ];
  const frameSrc = ["https://challenges.cloudflare.com", "https://www.linkedin.com"];
  const connectSrc = [
    "'self'",
    "https://cloudflareinsights.com",
    "https://vitals.vercel-insights.com",
    "https://edbgctmcyinzrectewel.supabase.co",
  ];
  return `script-src ${scriptSrc.join(" ")}; frame-src ${frameSrc.join(" ")}; connect-src ${connectSrc.join(" ")}`;
}
