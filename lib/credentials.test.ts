import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";
import * as ar from "./content.ar.ts";
import * as en from "./content.ts";
import { profilePageFor } from "./person-schema.ts";

const names = [
  "Microsoft AI Discovery Cards – Train The Trainer",
  "AWS Certified Solutions Architect – Professional",
  "Microsoft Certified: Azure Security Engineer Associate",
  "AWS Certified Solutions Architect – Associate",
  "Veeam Technical Sales Professional (VMTSP) 2020",
  "Microsoft Certified: Azure Solutions Architect Expert",
  "AZ-301 Microsoft Azure Architect Design",
  "AZ-300 Microsoft Azure Architect Technologies",
  "MCTS: Designing, Assessing, and Optimizing Software Asset Management (SAM)",
  "Symantec Backup Exec 2012",
  "MCPS: Microsoft Certified Professional",
  "Microsoft Private Cloud Professional 2012 SP1",
  "VTCP 5.0",
];

const validFrom = [
  "2026-04",
  "2021-02",
  "2020-11",
  "2020-09",
  "2020-04",
  "",
  "",
  "",
  "2015-03",
  "2013-05",
  "2013-03",
  "2013-03",
  "2013-02",
];

const statusWords = /\b(active|current|expired|expires|expiry|legacy)\b/i;

describe("credential list", () => {
  it("lists all 13 certificates newest first, with an issue date only where one is shown", () => {
    assert.deepEqual(en.credentialList.map((item) => item.name), names);
    assert.deepEqual(ar.credentialList.map((item) => item.name), names);
    assert.deepEqual(
      en.credentialList.map((item) => item.issuer),
      ar.credentialList.map((item) => item.issuer),
    );
    assert.deepEqual(
      en.credentialList.map((item) => item.issued),
      ["Apr 2026", "Feb 2021", "Nov 2020", "Sep 2020", "Apr 2020", "", "", "", "Mar 2015", "May 2013", "Mar 2013", "Mar 2013", "Feb 2013"],
    );
    assert.deepEqual(
      ar.credentialList.map((item) => item.issued),
      ["أبريل 2026", "فبراير 2021", "نوفمبر 2020", "سبتمبر 2020", "أبريل 2020", "", "", "", "مارس 2015", "مايو 2013", "مارس 2013", "مارس 2013", "فبراير 2013"],
    );
    for (const item of en.credentialList) {
      const arabic = ar.credentialList.find((other) => other.name === item.name);
      assert.ok(arabic);
      assert.equal(item.image, arabic.image);
      assert.equal(item.href, arabic.href);
      assert.equal(item.href.includes("credly.com/badges/"), false);
      assert.equal(item.alt.endsWith("badge"), true);
      assert.equal(arabic.alt.startsWith("شارة "), true);
      assert.equal(existsSync(`public${item.image}`), true);
    }
    const highlight = new Set(en.certifications.map((item) => item.name));
    for (const name of highlight) assert.equal(names.includes(name), true);
    const copy = JSON.stringify({
      en: en.credentialList,
      ar: ar.credentialList,
      enTitle: en.ui.home.certsListTitle,
      arTitle: ar.ui.home.certsListTitle,
      enIssued: en.ui.home.certsIssued,
      arIssued: ar.ui.home.certsIssued,
      enHeld: en.ui.forYou.held,
      arHeld: ar.ui.forYou.held,
      enIntro: en.ui.forYou.intro,
      arIntro: ar.ui.forYou.intro,
    });
    assert.equal(statusWords.test(copy), false);
    assert.equal(copy.includes("ST0-141"), false);
    assert.equal(copy.includes("E217-2499"), false);
    assert.equal(copy.includes("—"), false);
    assert.equal(en.ui.forYou.intro.includes("3 certificate"), false);
  });

  it("adds every certificate to JSON-LD without an expiry", () => {
    const credentials = profilePageFor("en").mainEntity.hasCredential as Array<Record<string, unknown>>;
    assert.equal(credentials.length, names.length);
    credentials.forEach((credential, index) => {
      assert.equal(credential["@type"], "EducationalOccupationalCredential");
      assert.equal(credential.name, names[index]);
      assert.equal(credential.credentialCategory, "certification");
      assert.equal("expires" in credential, false);
      assert.equal("identifier" in credential, false);
      const recognizedBy = credential.recognizedBy as { name: string };
      assert.equal(recognizedBy.name, en.credentialList[index].issuer);
      if (validFrom[index]) assert.equal(credential.validFrom, validFrom[index]);
      else assert.equal("validFrom" in credential, false);
    });
    const serialized = JSON.stringify(credentials);
    assert.equal(statusWords.test(serialized), false);
    assert.equal(serialized.includes("ST0-141"), false);
    assert.equal(serialized.includes("E217-2499"), false);
  });
});
