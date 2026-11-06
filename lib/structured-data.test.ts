import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { personId, websiteId } from "./person-schema.ts";
import { blogPostingLd, jsonLdScript, pageBreadcrumbs } from "./structured-data.ts";

const supabaseImage = "https://edbgctmcyinzrectewel.supabase.co/storage/v1/object/public/post-images/covers/vmware.png";

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
    assert.deepEqual(posting.isPartOf, { "@id": websiteId });
    assert.equal(posting.about, "Cloud is a regional capability");
    assert.equal(posting.dateModified, "2026-10-21");
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

  it("joins every post to the website and keeps one scheme on the image", () => {
    const vmware = blogPostingLd({
      title: "A VMware migration path",
      description: "Move the estate without a double-prefixed image.",
      date: "2026-10-22",
      lang: "en",
      slug: "2026-10-22-vmware-to-cloud-migration-path",
      image: supabaseImage,
      updatedAt: "2026-10-23T08:00:00.000Z",
    });
    assert.equal(vmware.image, supabaseImage);
    assert.equal(String(vmware.image).split("https://").length - 1, 1);
    assert.deepEqual(vmware.isPartOf, { "@id": websiteId });
    assert.deepEqual(vmware.author, { "@type": "Person", "@id": personId });
    assert.equal(vmware.about, "Platforms that survive reality");
    assert.equal(vmware.dateModified, "2026-10-23T08:00:00.000Z");

    const tagged = blogPostingLd({
      title: "Landing zone",
      description: "A note",
      date: "2026-11-03",
      lang: "en",
      slug: "2026-11-03-custom",
      tag: "Azure landing zone",
    });
    assert.equal(tagged.about, "Azure landing zone");
    assert.equal(tagged.dateModified, "2026-11-03");

    const arabic = blogPostingLd({
      title: "Knowing Kubernetes isn't knowing the cloud",
      description: "A note",
      date: "2026-10-20",
      lang: "ar",
      slug: "2026-10-20-kubernetes-isnt-cloud",
      image: "/posts/2026-10-20-kubernetes-isnt-cloud.png",
    });
    assert.equal(arabic.inLanguage, "ar");
    assert.equal(arabic.image, "https://alghazzi.org/posts/2026-10-20-kubernetes-isnt-cloud.png");
    assert.equal(String(arabic.image).split("https://").length - 1, 1);
    assert.equal(arabic.about, "Building teams and talent");
    assert.deepEqual(arabic.author, { "@type": "Person", "@id": personId });
    assert.equal(JSON.stringify(arabic).includes("FAQPage"), false);

    const untagged = blogPostingLd({
      title: "A note",
      description: "A note",
      date: "2026-01-01",
      lang: "en",
      slug: "2026-01-01-no-pillar",
    });
    assert.equal(untagged.about, "Cloud platforms");
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
