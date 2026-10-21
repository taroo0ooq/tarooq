import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { faq, faqPageFor, linkifyAnswer } from "../content/faq.ts";

const linkedIn = "https://www.linkedin.com/in/tareq-alghazzi";

describe("home FAQ", () => {
  it("builds FAQPage JSON-LD from the same items", () => {
    assert.equal(faq.en.items.length, 8);
    assert.equal(faq.ar.items.length, 7);
    for (const locale of ["en", "ar"] as const) {
      const page = faqPageFor(locale);
      assert.equal(page["@type"], "FAQPage");
      assert.equal(page.inLanguage, locale);
      assert.deepEqual(page.about, { "@id": "https://alghazzi.org/#person" });
      assert.equal(page.mainEntity.length, faq[locale].items.length);
      page.mainEntity.forEach((entity, index) => {
        const item = faq[locale].items[index];
        assert.equal(entity["@type"], "Question");
        assert.equal(entity.name, item.question);
        assert.equal(entity.acceptedAnswer["@type"], "Answer");
        assert.equal(entity.acceptedAnswer.text, item.answer);
      });
      assert.equal(JSON.stringify(page).includes('"@type":"Person"'), false);
    }
  });

  it("turns contact and LinkedIn mentions into links without changing the words", () => {
    for (const locale of ["en", "ar"] as const) {
      for (const item of faq[locale].items) {
        const parts = linkifyAnswer(item.answer);
        assert.equal(parts.map((part) => part.text).join(""), item.answer);
      }
    }
    const enTouch = linkifyAnswer(faq.en.items[7].answer);
    assert.deepEqual(
      enTouch.filter((part) => part.href),
      [
        { text: "alghazzi.org/contact", href: "/contact" },
        { text: "LinkedIn", href: linkedIn },
        { text: "linkedin.com/in/tareq-alghazzi", href: linkedIn },
      ],
    );
    const enName = linkifyAnswer(faq.en.items[1].answer);
    assert.equal(enName.filter((part) => part.href).length, 2);
    const arTouch = linkifyAnswer(faq.ar.items[6].answer);
    assert.deepEqual(
      arTouch.filter((part) => part.href),
      [
        { text: "alghazzi.org/ar/contact", href: "/ar/contact" },
        { text: "LinkedIn", href: linkedIn },
      ],
    );
    assert.equal(linkifyAnswer(faq.en.items[6].answer).some((part) => part.href), false);
  });

  it("renders the home section from the FAQ module", () => {
    const source = readFileSync("components/pages/HomePage.tsx", "utf8");
    assert.match(source, /from "@\/content\/faq"/);
    assert.match(source, /faqPageFor\(locale\)/);
    assert.match(source, /id="faq"/);
    assert.match(source, /faq\[locale\]\.items\.map/);
    assert.equal(source.includes("Who is Tareq Al-Ghazzi?"), false);
    assert.equal(source.includes("من هو طارق الغزي؟"), false);
  });
});
