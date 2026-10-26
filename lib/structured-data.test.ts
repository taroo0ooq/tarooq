import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { personId } from "./person-schema.ts";
import { blogPostingLd, jsonLdScript, pageBreadcrumbs } from "./structured-data.ts";

describe("structured data", () => {
  it("points a post author at the site person and adds breadcrumbs", () => {
    const posting = blogPostingLd({
      title: "Syria's digital systems",
      description: "A note",
      date: "2026-10-21",
      lang: "en",
      slug: "2026-10-21-syrias-digital-systems",
    });
    assert.equal(posting["@type"], "BlogPosting");
    assert.deepEqual(posting.author, { "@type": "Person", "@id": personId });
    assert.equal(JSON.stringify(posting).includes("FAQPage"), false);

    const crumbs = pageBreadcrumbs(
      "en",
      "posts",
      { home: "Home", current: "Posts" },
      {
        name: "Syria's digital systems",
        path: "/posts/2026-10-21-syrias-digital-systems",
      },
    );
    assert.equal(crumbs["@type"], "BreadcrumbList");
    assert.deepEqual(
      crumbs.itemListElement.map((item) => item.name),
      ["Home", "Posts", "Syria's digital systems"],
    );
    assert.equal(crumbs.itemListElement[0].item, "https://alghazzi.org");
    assert.equal(crumbs.itemListElement[1].item, "https://alghazzi.org/posts");

    const arabic = pageBreadcrumbs("ar", "business", { home: "الرئيسية", current: "الأعمال" });
    assert.deepEqual(
      arabic.itemListElement.map((item) => item.name),
      ["الرئيسية", "الأعمال"],
    );
    assert.equal(arabic.itemListElement[1].item, "https://alghazzi.org/ar/business");
    assert.equal(JSON.stringify(arabic).includes("FAQPage"), false);
  });

  it("escapes script-breaking characters before JSON-LD is injected", () => {
    const html = jsonLdScript({
      headline: "</script><script>alert(1)</script>",
      description: "a & b > c",
      note: "line\u2028sep",
    });
    assert.equal(html.includes("<"), false);
    assert.equal(html.includes(">"), false);
    assert.equal(html.includes("&"), false);
    assert.equal(html.includes("\u2028"), false);
    assert.match(html, /\\u003c\/script\\u003e\\u003cscript\\u003ealert\(1\)\\u003c\/script\\u003e/);
    assert.match(html, /a \\u0026 b \\u003e c/);
  });
});
