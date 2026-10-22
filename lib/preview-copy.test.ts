import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as ar from "./content.ar.ts";
import * as en from "./content.ts";
import { pillarIds } from "./pillars.ts";

const banned = ["—", "–", "Available for", "متاح ل", "FAQ", "open to opportunities", "game-changer"];

function publicBundles() {
  return [
    en.profile.availability,
    ar.profile.availability,
    en.ui.home.positioning,
    ar.ui.home.positioning,
    en.ui.home.earlier,
    ar.ui.home.earlier,
    en.problems.title,
    en.problems.intro,
    en.problems.reframe,
    ...en.problems.items.flatMap((item) => [item.title, item.body]),
    ar.problems.title,
    ar.problems.intro,
    ar.problems.reframe,
    ...ar.problems.items.flatMap((item) => [item.title, item.body]),
    ...en.stages.flatMap((stage) => [stage.title, stage.body]),
    ...ar.stages.flatMap((stage) => [stage.title, stage.body]),
    ...Object.values(en.businessPage).flatMap((value) => (Array.isArray(value) ? value : [value])),
    ...Object.values(ar.businessPage).flatMap((value) => (Array.isArray(value) ? value : [value])),
    ...en.offers.flatMap((offer) => [offer.title, offer.summary, offer.cta, ...offer.points]),
    ...ar.offers.flatMap((offer) => [offer.title, offer.summary, offer.cta, ...offer.points]),
    ...en.topics.map((topic) => topic.label),
    ...ar.topics.map((topic) => topic.label),
    ...en.pillars.map((pillar) => pillar.label),
    ...ar.pillars.map((pillar) => pillar.label),
    en.ui.contact.nextLabel,
    en.ui.contact.next,
    ar.ui.contact.nextLabel,
    ar.ui.contact.next,
    en.ui.posts.filter,
    en.ui.posts.allPillars,
    en.ui.posts.emptyPillar,
    ar.ui.posts.filter,
    ar.ui.posts.allPillars,
    ar.ui.posts.emptyPillar,
    en.ui.forYou.intro,
    ar.ui.forYou.intro,
    en.ui.business.title,
    ar.ui.business.title,
    en.ui.business.cta,
    ar.ui.business.cta,
  ];
}

describe("preview copy", () => {
  it("keeps the approved pillar names, three undated certs, and the practice boundary", () => {
    assert.deepEqual(
      en.pillars.map((pillar) => pillar.label),
      [
        "Platforms that survive reality",
        "Cloud is a regional capability",
        "Governed AI on the platform",
        "Building teams and talent",
      ],
    );
    assert.deepEqual(
      en.pillars.map((pillar) => pillar.id),
      [...pillarIds],
    );
    assert.deepEqual(
      ar.pillars.map((pillar) => pillar.id),
      en.pillars.map((pillar) => pillar.id),
    );
    assert.deepEqual(
      en.topics.map((topic) => topic.id),
      ar.topics.map((topic) => topic.id),
    );
    assert.equal(en.certifications.length, 3);
    assert.equal(ar.certifications.length, 3);
    for (const item of [...en.certifications, ...ar.certifications]) {
      assert.equal("date" in item, false);
      assert.equal(JSON.stringify(item).includes("202"), false);
    }
    assert.match(en.businessPage.model, /Mobiz does not endorse this practice/);
    assert.match(en.businessPage.model, /Nothing here describes Mobiz clients or Mobiz work/);
    assert.match(ar.businessPage.model, /لا يتبنّى هذه الممارسة/);
    assert.equal(JSON.stringify(en.offers).includes("What you get"), false);
    assert.equal(JSON.stringify(en.ui).includes("FAQ"), false);
    assert.equal(JSON.stringify(ar.ui).includes("FAQ"), false);
    for (const line of publicBundles()) {
      for (const token of banned) assert.equal(line.includes(token), false, `${token} in ${line}`);
    }
  });
});
