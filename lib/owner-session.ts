import { createHmac } from "node:crypto";
import { signingKey, statesMatch, tokensMatch } from "./linkedin";

export const OWNER_COOKIE = "li_owner";
export const SESSION_SECONDS = 60 * 60 * 12;

export function memberId(value: string) {
  const trimmed = value.trim();
  const prefix = "urn:li:person:";
  return trimmed.startsWith(prefix) ? trimmed.slice(prefix.length) : trimmed;
}

export function isOwner(personId: string) {
  const expected = memberId(process.env.LINKEDIN_PERSON_ID || "");
  const actual = memberId(personId || "");
  if (!expected || !actual) return false;
  return tokensMatch(actual, expected);
}

export function sealOwnerSession(personId: string, now = Date.now()) {
  const key = signingKey();
  if (!key) throw new Error("LINKEDIN_CLIENT_SECRET is not set.");
  const payload = Buffer.from(JSON.stringify({ personId: memberId(personId), exp: now + SESSION_SECONDS * 1000 })).toString("base64url");
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function openOwnerSession(value: string, now = Date.now()) {
  const key = signingKey();
  if (!key || !value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = createHmac("sha256", key).update(payload).digest("base64url");
  if (!statesMatch(sig, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { personId?: unknown; exp?: unknown };
    if (typeof data.personId !== "string" || typeof data.exp !== "number") return null;
    if (data.exp < now) return null;
    if (!isOwner(data.personId)) return null;
    return { personId: memberId(data.personId) };
  } catch {
    return null;
  }
}
