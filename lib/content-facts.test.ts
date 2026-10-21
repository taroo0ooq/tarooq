import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as ar from "./content.ar.ts";
import * as en from "./content.ts";

describe("Bank Albilad dates", () => {
  it("uses December 2022 to November 2025 and keeps the title", () => {
    const english = en.roles.find((role) => role.id === "albilad");
    const arabic = ar.roles.find((role) => role.id === "albilad");
    assert.ok(english);
    assert.ok(arabic);
    assert.equal(english.title, "Lead Cloud Architect");
    assert.equal(english.start, "December 2022");
    assert.equal(english.end, "November 2025");
    assert.equal(english.span, "December 2022 — November 2025");
    assert.equal(arabic.title, "المعماري الرئيسي للسحابة");
    assert.equal(arabic.start, "ديسمبر 2022");
    assert.equal(arabic.end, "نوفمبر 2025");
    assert.equal(arabic.span, "ديسمبر 2022 — نوفمبر 2025");
    assert.equal(en.about.some((line) => line.includes("June 2022") || line.includes("February 2026")), false);
    assert.equal(ar.about.some((line) => line.includes("يونيو 2022") || line.includes("فبراير 2026")), false);
  });
});

describe("certifications", () => {
  it("drops the undated-cv note and keeps official badges off personal Credly links", () => {
    assert.equal("certsNote" in en.ui.home, false);
    assert.equal("certsNote" in ar.ui.home, false);
    assert.equal(JSON.stringify(en.ui).includes("Named as earned on the CV"), false);
    assert.equal(JSON.stringify(ar.ui).includes("مذكورة كما وردت في السيرة"), false);
    const names = en.certifications.map((item) => item.name);
    assert.deepEqual(names, ar.certifications.map((item) => item.name));
    const badged = en.certifications.filter((item) => item.image);
    assert.deepEqual(badged.map((item) => item.name), [
      "Microsoft Certified: Azure Security Engineer Associate",
      "AZ-300 Microsoft Azure Architect Technologies",
      "AWS Certified Solutions Architect – Associate",
    ]);
    for (const item of badged) {
      assert.equal(item.href?.includes("credly.com/badges/"), false);
      assert.equal(item.image, ar.certifications.find((other) => other.name === item.name)?.image);
      assert.equal(item.href, ar.certifications.find((other) => other.name === item.name)?.href);
    }
    assert.equal(en.certifications.find((item) => item.name.startsWith("Microsoft Certified: Azure Security"))?.alt?.endsWith("badge"), true);
    assert.equal(ar.certifications.find((item) => item.name.startsWith("Microsoft Certified: Azure Security"))?.alt?.startsWith("شارة "), true);
    const plain = en.certifications.filter((item) => !item.image).map((item) => item.name);
    assert.deepEqual(plain, ["Microsoft Private Cloud Professional 2012 SP1", "MCPS: Microsoft Certified Professional"]);
  });
});