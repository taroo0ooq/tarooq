import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatLlmsPosts, llmsResponse, llmsTemplate, renderLlms } from "./llms-text.ts";

const sample = [
  { title: "Syria's digital systems", slug: "2026-10-21-syrias-digital-systems", lang: "en", date: "2026-10-21" },
  { title: "معرفة Kubernetes لا تعني معرفة السحابة", slug: "2026-10-20-kubernetes-isnt-cloud", lang: "ar", date: "2026-10-20" },
];

describe("llms.txt", () => {
  it("keeps the approved profile and fills posts from the published list", async () => {
    const template = llmsTemplate();
    assert.match(template, /^# Tareq Al-Ghazzi\n/);
    assert.match(template, /^- Previously Lead Cloud Architect at Bank Albilad, Riyadh \(December 2022 to November 2025\), leading the bank's Azure cloud work in a regulated Saudi banking environment\.\n/m);
    assert.equal(template.includes("{{posts}}"), true);
    assert.equal(template.includes("github.com"), false);
    const text = renderLlms(sample);
    assert.equal(text.includes("{{posts}}"), false);
    assert.match(text, /\[Syria's digital systems\]\(https:\/\/alghazzi\.org\/posts\/2026-10-21-syrias-digital-systems\) \(English\)\./);
    assert.match(text, /\[معرفة Kubernetes لا تعني معرفة السحابة\]\(https:\/\/alghazzi\.org\/ar\/posts\/2026-10-20-kubernetes-isnt-cloud\) \(Arabic\)\./);
    assert.match(text, /his own independent practice, separate from his employment at Mobiz IT/);
    const newer = renderLlms([
      ...sample,
      { title: "A newer note", slug: "2026-10-22-vmware-to-cloud-migration-path", lang: "", date: "2026-10-22" },
    ]);
    assert.match(newer, /\[A newer note\]\(https:\/\/alghazzi\.org\/posts\/2026-10-22-vmware-to-cloud-migration-path\) \(English\)\./);
    assert.ok(newer.indexOf("A newer note") < newer.indexOf("Syria's digital systems"));
    const response = llmsResponse(sample);
    assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
    assert.equal(await response.text(), text);
    assert.match(formatLlmsPosts([]), /^$/);
  });
});
