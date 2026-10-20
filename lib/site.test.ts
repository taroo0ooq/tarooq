import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { absoluteUrl, pageMetadata, resolveSiteUrl, siteUrl } from "./site.ts";

describe("site url", () => {
  it("defaults to the production origin", () => {
    assert.equal(resolveSiteUrl(""), "https://alghazzi.org");
    assert.equal(resolveSiteUrl("   "), "https://alghazzi.org");
    assert.equal(resolveSiteUrl("not a url"), "https://alghazzi.org");
  });

  it("drops a trailing slash, a path, and www", () => {
    assert.equal(resolveSiteUrl("https://alghazzi.org/"), "https://alghazzi.org");
    assert.equal(resolveSiteUrl("https://alghazzi.org/posts/"), "https://alghazzi.org");
    assert.equal(resolveSiteUrl("https://www.alghazzi.org"), "https://alghazzi.org");
    assert.equal(resolveSiteUrl("http://alghazzi.org"), "https://alghazzi.org");
  });

  it("honors an explicit override, including local http", () => {
    assert.equal(resolveSiteUrl("https://example.com/"), "https://example.com");
    assert.equal(resolveSiteUrl("http://localhost:3000"), "http://localhost:3000");
  });

  it("builds page urls without a trailing slash", () => {
    const base = "https://alghazzi.org";
    assert.equal(absoluteUrl("/", base), base);
    assert.equal(absoluteUrl("", base), base);
    assert.equal(absoluteUrl("/posts/hello/", base), `${base}/posts/hello`);
    assert.equal(absoluteUrl("contact", base), `${base}/contact`);
  });

  it("uses the resolved origin as the shared constant", () => {
    assert.equal(siteUrl, resolveSiteUrl());
  });

  it("sets a canonical, share title, and image for a page", () => {
    const metadata = pageMetadata("/posts/example", {
      title: "Example",
      description: "A note",
      openGraph: { type: "article", publishedTime: "2026-10-12" },
    });
    assert.equal(metadata.alternates && "canonical" in metadata.alternates ? metadata.alternates.canonical : "", "https://alghazzi.org/posts/example");
    assert.equal(metadata.openGraph?.url, "https://alghazzi.org/posts/example");
    assert.equal(metadata.openGraph && "type" in metadata.openGraph ? metadata.openGraph.type : "", "article");
    assert.equal(metadata.openGraph?.title, "Example — Tareq Al-Ghazzi");
    const images = metadata.openGraph?.images;
    const image = Array.isArray(images) ? images[0] : images;
    assert.equal(image && typeof image === "object" && "url" in image ? image.url : "", "/opengraph-image");
  });
});
