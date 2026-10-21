import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPosts } from "./posts.ts";
import { postCanonicalPath, postLanguage, postRedirectPath } from "./post-locale.ts";
import { buildSitemap, postSitemapEntry } from "./sitemap-data.ts";
import { absoluteUrl, pageMetadata } from "./site.ts";

describe("post language urls", () => {
  it("keeps each published file on its own language url", () => {
    const kubernetes = getPosts().find((post) => post.slug === "2026-10-20-kubernetes-isnt-cloud");
    const syria = getPosts().find((post) => post.slug === "2026-10-21-syrias-digital-systems");
    assert.ok(kubernetes);
    assert.ok(syria);
    assert.equal(postLanguage(kubernetes.lang), "ar");
    assert.equal(postCanonicalPath(kubernetes.slug, kubernetes.lang), "/ar/posts/2026-10-20-kubernetes-isnt-cloud");
    assert.equal(postRedirectPath(kubernetes.slug, kubernetes.lang, "en"), "/ar/posts/2026-10-20-kubernetes-isnt-cloud");
    assert.equal(postRedirectPath(kubernetes.slug, kubernetes.lang, "ar"), null);
    assert.equal(postLanguage(syria.lang), "en");
    assert.equal(postCanonicalPath(syria.slug, syria.lang), "/posts/2026-10-21-syrias-digital-systems");
    assert.equal(postRedirectPath(syria.slug, syria.lang, "ar"), "/posts/2026-10-21-syrias-digital-systems");
    assert.equal(postRedirectPath(syria.slug, syria.lang, "en"), null);
  });

  it("advertises only the post language in hreflang", () => {
    const path = "/ar/posts/2026-10-20-kubernetes-isnt-cloud";
    const canonical = absoluteUrl(path);
    const metadata = pageMetadata(path, { title: "Example", description: "A note" }, {
      languages: { ar: canonical, "x-default": canonical },
    });
    assert.equal(metadata.alternates?.canonical, canonical);
    assert.deepEqual(metadata.alternates?.languages, { ar: canonical, "x-default": canonical });
    assert.equal(metadata.openGraph?.locale, "ar_SA");
  });

  it("lists one sitemap url per post and no false alternate", () => {
    const posts = getPosts().map((post) => ({ slug: post.slug, date: post.date, lang: post.lang }));
    const sitemap = buildSitemap(posts);
    const urls = sitemap.map((entry) => entry.url);
    assert.equal(urls.filter((url) => url.endsWith("/posts/2026-10-20-kubernetes-isnt-cloud")).length, 1);
    assert.equal(urls.includes("https://alghazzi.org/ar/posts/2026-10-20-kubernetes-isnt-cloud"), true);
    assert.equal(urls.includes("https://alghazzi.org/posts/2026-10-20-kubernetes-isnt-cloud"), false);
    assert.equal(urls.includes("https://alghazzi.org/posts/2026-10-21-syrias-digital-systems"), true);
    assert.equal(urls.includes("https://alghazzi.org/ar/posts/2026-10-21-syrias-digital-systems"), false);
    const kubernetes = postSitemapEntry(posts.find((post) => post.slug.endsWith("kubernetes-isnt-cloud"))!);
    assert.deepEqual(kubernetes.alternates?.languages, {
      ar: "https://alghazzi.org/ar/posts/2026-10-20-kubernetes-isnt-cloud",
      "x-default": "https://alghazzi.org/ar/posts/2026-10-20-kubernetes-isnt-cloud",
    });
    const home = sitemap.filter((entry) => entry.url === "https://alghazzi.org" || entry.url === "https://alghazzi.org/ar");
    assert.equal(home.length, 2);
    assert.equal(home[0]?.alternates?.languages?.en, "https://alghazzi.org");
    assert.equal(home[0]?.alternates?.languages?.ar, "https://alghazzi.org/ar");
  });
});
