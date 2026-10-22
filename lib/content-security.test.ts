import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contentSecurityPolicy } from "./content-security.ts";

describe("content security policy", () => {
  it("allows Turnstile, the analytics beacon, and the hosts the site already uses", () => {
    const policy = contentSecurityPolicy();
    assert.match(policy, /script-src[^;]*'self'/);
    assert.match(policy, /script-src[^;]*'unsafe-inline'/);
    assert.match(policy, /script-src[^;]*https:\/\/va\.vercel-scripts\.com/);
    assert.match(policy, /script-src[^;]*https:\/\/challenges\.cloudflare\.com/);
    assert.match(policy, /script-src[^;]*https:\/\/static\.cloudflareinsights\.com/);
    assert.match(policy, /frame-src[^;]*https:\/\/challenges\.cloudflare\.com/);
    assert.match(policy, /frame-src[^;]*https:\/\/www\.linkedin\.com/);
    assert.match(policy, /connect-src[^;]*'self'/);
    assert.match(policy, /connect-src[^;]*https:\/\/cloudflareinsights\.com/);
    assert.match(policy, /connect-src[^;]*https:\/\/vitals\.vercel-insights\.com/);
    assert.match(policy, /connect-src[^;]*https:\/\/edbgctmcyinzrectewel\.supabase\.co/);
    assert.doesNotMatch(policy, /1x00000000000000000000AA/);
    assert.doesNotMatch(policy, /beacon-token/);
  });
});
