import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { llmsBody, llmsResponse } from "./llms-text.ts";

describe("llms.txt", () => {
  it("serves the approved text as utf-8 plain text", async () => {
    const body = llmsBody();
    assert.equal(createHash("sha256").update(body).digest("hex"), "eec33fd0454bff9d1345f2f3128fa38d3fe720a6ea8444ce886f662bc8c3171d");
    const text = body.toString("utf8");
    assert.match(text, /^# Tareq Al-Ghazzi\n/);
    assert.match(text, /\[Kubernetes isn't cloud\]\(https:\/\/alghazzi\.org\/ar\/posts\/2026-10-20-kubernetes-isnt-cloud\) \(Arabic\)\.\n/);
    assert.equal(text.includes("github.com"), false);
    const response = llmsResponse();
    assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
    assert.equal(Buffer.from(await response.arrayBuffer()).equals(body), true);
  });
});
