import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { personId } from "./person-schema.ts";
import { blogPostingLd, pageBreadcrumbs } from "./structured-data.ts";

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
});
