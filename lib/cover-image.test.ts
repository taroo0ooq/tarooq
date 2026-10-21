import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coverSize, localCoverSize } from "./cover-image.ts";

describe("cover sizes", () => {
  it("reads the intrinsic size of the local post pngs", () => {
    assert.deepEqual(localCoverSize("/posts/syrias-digital-systems.png"), { width: 1200, height: 627 });
    assert.deepEqual(localCoverSize("/posts/2026-10-20-kubernetes-isnt-cloud.png"), { width: 1200, height: 627 });
  });

  it("rejects paths outside public and falls back for remote covers", () => {
    assert.equal(localCoverSize("../package.json"), null);
    assert.equal(localCoverSize("/../package.json"), null);
    assert.deepEqual(coverSize("https://edbgctmcyinzrectewel.supabase.co/storage/v1/object/public/post-images/covers/note.png"), {
      width: 1200,
      height: 630,
    });
  });
});
