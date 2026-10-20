import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rateLimit, resetRateLimit } from "./rate-limit.ts";

describe("rate limit", () => {
  it("blocks the next call inside the window", () => {
    resetRateLimit();
    const now = 1_000_000;
    assert.equal(rateLimit("posts-test", 2, 10_000, now).ok, true);
    assert.equal(rateLimit("posts-test", 2, 10_000, now + 1).ok, true);
    const blocked = rateLimit("posts-test", 2, 10_000, now + 2);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.ok(blocked.retryAfter >= 1);
    assert.equal(rateLimit("posts-test", 2, 10_000, now + 10_001).ok, true);
    resetRateLimit();
  });
});
