import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { siteUrl } from "@/lib/site";

export const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || "77qvkeuxzk5afg";
export const LINKEDIN_VERSION = process.env.LINKEDIN_VERSION || "202609";
export const STATE_COOKIE = "li_oauth_state";
export const SETUP_COOKIE = "li_setup";

// LinkedIn redirect URIs are exact origins. tarooq.vercel.app still serves this app, so it stays registered.
const extraOrigins = ["https://tarooq.vercel.app", "http://localhost:3000"];
export const registeredOrigins = [...new Set([siteUrl, ...extraOrigins])];
const allowedOrigins = new Set(registeredOrigins);

export function unregisteredOriginMessage() {
  return `This host is not a registered LinkedIn redirect. Use ${registeredOrigins.join(" or ")}.`;
}

export function siteOrigin(request: Request) {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0]?.trim() ?? "";
  if (!host) return siteUrl;
  const hostname = host.replace(/:\d+$/, "");
  if (hostname === "localhost" || hostname === "127.0.0.1") return `http://${host}`;
  return `https://${hostname}`;
}

export function isRegisteredOrigin(origin: string) {
  return allowedOrigins.has(origin);
}

export function authorizationUrl(origin: string, state: string) {
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", LINKEDIN_CLIENT_ID);
  url.searchParams.set("redirect_uri", `${origin}/api/linkedin/callback`);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "openid profile email w_member_social");
  return url;
}

export function newState() {
  return randomBytes(24).toString("base64url");
}

export function statesMatch(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function secretKey() {
  const secret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!secret) throw new Error("LINKEDIN_CLIENT_SECRET is not set.");
  return createHash("sha256").update(secret).digest();
}

export type SetupPayload = {
  accessToken: string;
  expiresAt: string;
  personId: string;
  personUrn: string;
  name: string;
  email: string;
};

export function sealSetup(payload: SetupPayload) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]).toString("base64url");
}

export function openSetup(token: string): SetupPayload | null {
  try {
    const buf = Buffer.from(token, "base64url");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", secretKey(), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    return JSON.parse(json) as SetupPayload;
  } catch {
    return null;
  }
}

export async function exchangeCode(origin: string, code: string) {
  const secret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!secret) throw new Error("LINKEDIN_CLIENT_SECRET is not set.");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: `${origin}/api/linkedin/callback`,
    client_id: LINKEDIN_CLIENT_ID,
    client_secret: secret,
  });
  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "LinkedIn did not return a token.");
  }
  return { accessToken: payload.access_token, expiresIn: payload.expires_in ?? 0 };
}

export async function fetchMember(accessToken: string) {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = (await response.json()) as { sub?: string; name?: string; email?: string; error?: string };
  if (!response.ok || !payload.sub) {
    throw new Error("LinkedIn did not return the member id.");
  }
  return { personId: payload.sub, name: payload.name ?? "", email: payload.email ?? "" };
}

export function personUrn(personId: string) {
  return personId.startsWith("urn:") ? personId : `urn:li:person:${personId}`;
}

export function cookieHeader(name: string, value: string, options: { maxAge: number; secure: boolean; path?: string }) {
  const parts = [
    `${name}=${value}`,
    `Path=${options.path ?? "/"}`,
    `Max-Age=${options.maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}
