import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { llmsBody, llmsResponse } from "./llms-text.ts";

describe("llms.txt", () => {
  it("serves the approved text as utf-8 plain text", async () => {
    const body = llmsBody();
    assert.equal(createHash("sha256").update(body).digest("hex"), "239edb16fec4a84601985b49b70fcbbd3a514c27c52c9574b762358d16db00c4");
    const text = body.toString("utf8");
    assert.match(text, /^# Tareq Al-Ghazzi\n/);
    assert.match(text, /^- Previously Lead Cloud Architect at Bank Albilad, Riyadh \(December 2022 to November 2025\), leading the bank's Azure cloud work in a regulated Saudi banking environment\.\n/m);
    assert.match(text, /\[Kubernetes isn't cloud\]\(https:\/\/alghazzi\.org\/ar\/posts\/2026-10-20-kubernetes-isnt-cloud\) \(Arabic\)\.\n/);
    assert.equal(text.includes("github.com"), false);
    const response = llmsResponse();
    assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
    assert.equal(Buffer.from(await response.arrayBuffer()).equals(body), true);
  });
});
