import { SETUP_COOKIE, cookieHeader, openSetup, siteOrigin, type SetupPayload } from "@/lib/linkedin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function expiredHtml() {
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>LinkedIn connected</title>
<body style="margin:0;background:#f8f7fc;color:#0b1f3a;font-family:Inter,Segoe UI,sans-serif;line-height:1.5;">
<main style="max-width:40rem;margin:0 auto;padding:64px 6vw 80px;">
<p style="color:#f59e0b;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;font-size:0.78rem;">LinkedIn</p>
<h1 style="font-family:Georgia,Times New Roman,serif;font-weight:400;font-size:clamp(2.2rem,5vw,3.4rem);letter-spacing:-0.03em;line-height:1.05;">This setup link has expired.</h1>
<p>Connect again. The token is shown once, then the cookie is cleared.</p>
<p><a href="/api/linkedin/start" style="color:#6d28d9;font-weight:700;">Connect again</a></p>
</main>`;
}

function setupHtml(payload: SetupPayload) {
  const token = escapeHtml(payload.accessToken);
  const personId = escapeHtml(payload.personId);
  const urn = escapeHtml(payload.personUrn);
  const expires = escapeHtml(payload.expiresAt);
  const name = escapeHtml(payload.name || "Connected member");
  const email = escapeHtml(payload.email || "No email returned");
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>LinkedIn connected</title>
<body style="margin:0;background:#f8f7fc;color:#0b1f3a;font-family:Inter,Segoe UI,sans-serif;line-height:1.5;">
<main style="max-width:40rem;margin:0 auto;padding:64px 6vw 80px;">
<p style="color:#f59e0b;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;font-size:0.78rem;">LinkedIn</p>
<h1 style="font-family:Georgia,Times New Roman,serif;font-weight:400;font-size:clamp(2.2rem,5vw,3.4rem);letter-spacing:-0.03em;line-height:1.05;">Copy the token once.</h1>
<p>${name}<br>${email}</p>
<p>Save these, then leave the page. Refreshing it will not show the token again. Posts publish as this member, not as the company page.</p>
<label for="token" style="display:block;font-weight:700;margin-top:20px;">LINKEDIN_ACCESS_TOKEN</label>
<textarea id="token" readonly spellcheck="false" autocomplete="off" style="width:100%;min-height:120px;margin-top:8px;padding:12px;border:2px solid #e6e3f0;border-radius:12px;font:inherit;">${token}</textarea>
<p><strong>LINKEDIN_PERSON_ID</strong><br><code>${personId}</code></p>
<p>The raw id above, or <code>${urn}</code>, can be stored. Use the same value in the Vercel env and the GitHub secret.</p>
<p><strong>LINKEDIN_TOKEN_EXPIRES</strong><br><code>${expires}</code></p>
<p>Put that date in the GitHub variable LINKEDIN_TOKEN_EXPIRES. Also store LINKEDIN_ACCESS_TOKEN as a Vercel env and a GitHub secret.</p>
</main>`;
}

export function GET(request: Request) {
  const origin = siteOrigin(request);
  const secure = origin.startsWith("https://");
  const header = request.headers.get("cookie") ?? "";
  let sealed = "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === SETUP_COOKIE) sealed = decodeURIComponent(rest.join("="));
  }
  const payload = sealed ? openSetup(sealed) : null;
  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
  });
  if (sealed) headers.append("Set-Cookie", cookieHeader(SETUP_COOKIE, "", { maxAge: 0, secure, path: "/linkedin" }));
  return new Response(payload ? setupHtml(payload) : expiredHtml(), { status: 200, headers });
}
