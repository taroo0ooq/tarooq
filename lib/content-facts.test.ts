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