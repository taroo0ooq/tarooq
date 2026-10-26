/**
 * Baseline is same-origin. script-src still allows the inline theme boot script.
 * style-src allows inline styles (the theme script, Next font/style attributes,
 * and the LinkedIn callback page). img-src allows desk previews (blob) and
 * public cover images on Supabase. Turnstile, LinkedIn embeds, Cloudflare
 * analytics, and Vercel analytics stay on the hosts the pages already use.
 */
export function contentSecurityPolicy() {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://va.vercel-scripts.com",
    "https://challenges.cloudflare.com",
    "https://static.cloudflareinsights.com",
  ];
  const styleSrc = ["'self'", "'unsafe-inline'"];
  const imgSrc = ["'self'", "blob:", "data:", "https://edbgctmcyinzrectewel.supabase.co"];
  const fontSrc = ["'self'"];
  const frameSrc = ["https://challenges.cloudflare.com", "https://www.linkedin.com"];
  const connectSrc = [
    "'self'",
    "https://cloudflareinsights.com",
    "https://vitals.vercel-insights.com",
    "https://edbgctmcyinzrectewel.supabase.co",
  ];
  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    `img-src ${imgSrc.join(" ")}`,
    `font-src ${fontSrc.join(" ")}`,
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function securityHeaders() {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy() },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ];
}
