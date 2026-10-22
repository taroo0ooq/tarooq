import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contentSecurityPolicy } from "./content-security.ts";

describe("content security policy", () => {
  it("allows the Turnstile script and frame, and keeps the hosts the site already uses", () => {
    const policy = contentSecurityPolicy();
    assert.match(policy, /script-src[^;]*https:\/\/challenges\.cloudflare\.com/);
    assert.match(policy, /frame-src[^;]*https:\/\/challenges\.cloudflare\.com/);
    assert.match(policy, /script-src[^;]*'self'/);
    assert.match(policy, /script-src[^;]*'unsafe-inline'/);
    assert.match(policy, /script-src[^;]*https:\/\/va\.vercel-scripts\.com/);
    assert.match(policy, /frame-src[^;]*https:\/\/www\.linkedin\.com/);
    assert.doesNotMatch(policy, /1x00000000000000000000AA/);
  });
});
