import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { turnstileTestSiteKey, turnstileSiteKey } from "./turnstile-public.ts";
import { turnstileRejectedMessage } from "./turnstile-public.ts";
import { turnstileSecret, turnstileTestSecret, turnstileVisitorIp, verifyTurnstile } from "./turnstile.ts";

const originalFetch = globalThis.fetch;
const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const secretKey = process.env.TURNSTILE_SECRET_KEY;
const vercelEnv = process.env.VERCEL_ENV;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (siteKey === undefined) delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  else process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = siteKey;
  if (secretKey === undefined) delete process.env.TURNSTILE_SECRET_KEY;
  else process.env.TURNSTILE_SECRET_KEY = secretKey;
  if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = vercelEnv;
});

describe("turnstile keys", () => {
  it("uses the always-pass test keys when the env vars are missing", () => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.VERCEL_ENV;
    assert.equal(turnstileSiteKey(), turnstileTestSiteKey);
    assert.equal(turnstileSecret(), turnstileTestSecret);
    assert.equal(turnstileTestSiteKey, "1x00000000000000000000AA");
    assert.equal(turnstileTestSecret, "1x0000000000000000000000000000000AA");
  });

  it("uses a configured key and ignores blank values outside production", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "  site-from-env  ";
    process.env.TURNSTILE_SECRET_KEY = "   ";
    process.env.VERCEL_ENV = "preview";
    assert.equal(turnstileSiteKey(), "site-from-env");
    assert.equal(turnstileSecret(), turnstileTestSecret);
  });

  it("fails closed in production when the secret is missing", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    process.env.VERCEL_ENV = "production";
    assert.equal(turnstileSecret(), "");
    let called = false;
    globalThis.fetch = async () => {
      called = true;
      return Response.json({ success: true });
    };
    assert.equal(await verifyTurnstile("token-once", "203.0.113.8"), false);
    assert.equal(called, false);
  });
});

describe("turnstile verification", () => {
  it("reads the visitor address from the forwarding headers", () => {
    const forwarded = new Request("https://alghazzi.org/api/contact", { headers: { "x-forwarded-for": "203.0.113.8, 10.0.0.1" } });
    const real = new Request("https://alghazzi.org/api/contact", { headers: { "x-real-ip": "203.0.113.9" } });
    const missing = new Request("https://alghazzi.org/api/contact");
    assert.equal(turnstileVisitorIp(forwarded), "203.0.113.8");
    assert.equal(turnstileVisitorIp(real), "203.0.113.9");
    assert.equal(turnstileVisitorIp(missing), "");
  });

  it("rejects a missing or oversized token without calling siteverify", async () => {
    let called = false;
    globalThis.fetch = async () => {
      called = true;
      return Response.json({ success: true });
    };
    assert.equal(await verifyTurnstile("", "203.0.113.8"), false);
    assert.equal(await verifyTurnstile("x".repeat(2049), "203.0.113.8"), false);
    assert.equal(called, false);
  });

  it("posts the secret, token, and visitor IP, and accepts a single success", async () => {
    const calls: { url: string; body: string }[] = [];
    globalThis.fetch = async (input, init) => {
      calls.push({ url: String(input), body: String(init?.body ?? "") });
      return Response.json({ success: true });
    };
    assert.equal(await verifyTurnstile("token-once", "203.0.113.8"), true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const body = new URLSearchParams(calls[0]?.body);
    assert.equal(body.get("secret"), turnstileTestSecret);
    assert.equal(body.get("response"), "token-once");
    assert.equal(body.get("remoteip"), "203.0.113.8");
  });

  it("omits the IP when the request has none and rejects a failed check", async () => {
    globalThis.fetch = async (_input, init) => {
      const body = new URLSearchParams(String(init?.body ?? ""));
      assert.equal(body.get("remoteip"), null);
      return Response.json({ success: false, "error-codes": ["invalid-input-response"] });
    };
    assert.equal(await verifyTurnstile("used-token", ""), false);
    assert.equal(turnstileRejectedMessage, "The check didn't go through. Try again.");
  });

  it("fails closed when siteverify is unreachable", async () => {
    globalThis.fetch = async () => {
      throw new Error("network");
    };
    assert.equal(await verifyTurnstile("token-once", "203.0.113.8"), false);
  });
});
