import assert from "node:assert/strict";
import { describe, it } from "node:test";
import config from "../next.config.ts";

describe("post image config", () => {
  it("serves avif and webp and allows the post-images bucket", () => {
    assert.deepEqual(config.images?.formats, ["image/avif", "image/webp"]);
    assert.deepEqual(config.images?.deviceSizes, [640, 750, 828, 1080, 1200]);
    const patterns = config.images?.remotePatterns ?? [];
    const match = patterns.find((pattern) => typeof pattern === "object" && pattern.hostname === "edbgctmcyinzrectewel.supabase.co");
    assert.ok(match && typeof match === "object");
    assert.equal(match.protocol, "https");
    assert.equal(match.pathname, "/storage/v1/object/public/post-images/**");
  });
});
