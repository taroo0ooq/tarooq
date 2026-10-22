import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as ar from "./content.ar.ts";
import * as en from "./content.ts";
import { alternatePaths, isPostArticlePath, languageSwitch, localizePath } from "./locale.ts";
import { absoluteUrl, pageMetadata } from "./site.ts";
import { postsForLocale } from "./posts.ts";

const publicPaths = [
  "/",
  "/for-you",
  "/business",
  "/posts",
  "/contact",
  "/privacy",
];

function languagesOf(path: string) {
  const metadata = pageMetadata(path, { title: "Example", description: "A note" });
  const languages = metadata.alternates?.languages;
  assert.ok(languages);
  return languages as Record<string, string>;
}

describe("language switcher", () => {
  for (const path of publicPaths) {
    it(`maps ${path} to the other language and back`, () => {
      const toArabic = languageSwitch(path);
      assert.equal(toArabic.href, localizePath(path, "ar"));
      assert.equal(toArabic.hrefLang, "ar");
      assert.equal(toArabic.label, "العربية");
      assert.equal(toArabic.ariaLabel.includes(toArabic.label), true);

      const toEnglish = languageSwitch(toArabic.href);
      assert.equal(toEnglish.href, path);
      assert.equal(toEnglish.hrefLang, "en");
      assert.equal(toEnglish.label, "English");
      assert.equal(toEnglish.ariaLabel.includes(toEnglish.label), true);
    });
  }

  it("keeps the story anchor on the home page", () => {
    assert.equal(languageSwitch("/", "#story").href, "/ar#story");
    assert.equal(languageSwitch("/ar", "#story").href, "/#story");
    assert.equal(languageSwitch("/ar#approach").href, "/#approach");
  });

  it("sends the English-only editor to the Arabic home", () => {
    const switched = languageSwitch("/posts/new");
    assert.equal(switched.href, "/ar");
    assert.equal(switched.hrefLang, "ar");
  });

  it("switches a single-language post to the posts index, not a false translation", () => {
    assert.equal(isPostArticlePath("/posts/2026-10-20-kubernetes-isnt-cloud"), true);
    assert.equal(isPostArticlePath("/ar/posts/2026-10-21-syrias-digital-systems"), true);
    assert.equal(isPostArticlePath("/posts/new"), false);
    const toArabic = languageSwitch("/posts/2026-10-21-syrias-digital-systems");
    assert.equal(toArabic.href, "/ar/posts");
    assert.equal(toArabic.hrefLang, "ar");
    const toEnglish = languageSwitch("/ar/posts/2026-10-20-kubernetes-isnt-cloud");
    assert.equal(toEnglish.href, "/posts");
    assert.equal(toEnglish.hrefLang, "en");
    assert.equal(languageSwitch(toArabic.href).href, "/posts");
    assert.equal(languageSwitch(toEnglish.href).href, "/ar/posts");
  });
});

describe("hreflang alternates", () => {
  for (const path of publicPaths) {
    it(`sets en, ar, and x-default for ${path}`, () => {
      const paths = alternatePaths(path);
      const english = languagesOf(path);
      const arabic = languagesOf(localizePath(path, "ar"));
      const expected = {
        en: absoluteUrl(paths.en),
        ar: absoluteUrl(paths.ar),
        "x-default": absoluteUrl(paths["x-default"]),
      };

      assert.deepEqual(english, expected);
      assert.deepEqual(arabic, expected);
      assert.equal(english["x-default"], absoluteUrl(paths.en));
      assert.equal(pageMetadata(path).alternates?.canonical, absoluteUrl(path));
      assert.equal(pageMetadata(localizePath(path, "ar")).alternates?.canonical, absoluteUrl(paths.ar));
      assert.equal(pageMetadata(path, { title: "Example" }).openGraph?.locale, "en_US");
      assert.equal(pageMetadata(localizePath(path, "ar"), { title: "مثال" }).openGraph?.locale, "ar_SA");
    });
  }
});

describe("arabic post order", () => {
  it("lists Arabic posts first and keeps the English order otherwise", () => {
    const posts = [
      { lang: "", date: "2026-10-12", slug: "en" },
      { lang: "ar", date: "2026-10-20", slug: "ar" },
      { lang: "ar", date: "2026-10-01", slug: "older-ar" },
    ];
    assert.deepEqual(
      postsForLocale(posts, "ar").map((post) => post.slug),
      ["ar", "older-ar", "en"],
    );
    assert.deepEqual(
      postsForLocale(posts, "en").map((post) => post.slug),
      ["en", "ar", "older-ar"],
    );
  });
});

describe("arabic content shape", () => {
  it("matches the English content keys and list lengths", () => {
    const skip = new Set(["__esModule"]);
    for (const key of Object.keys(en)) {
      if (skip.has(key)) continue;
      assert.ok(key in ar, key);
      assertShape((en as Record<string, unknown>)[key], (ar as Record<string, unknown>)[key], key);
    }
  });
});

function assertShape(left: unknown, right: unknown, path: string) {
  if (typeof left === "string" || typeof left === "number" || typeof left === "boolean") {
    assert.equal(typeof right, typeof left, path);
    return;
  }
  if (Array.isArray(left)) {
    assert.ok(Array.isArray(right), path);
    assert.equal(right.length, left.length, `${path} length`);
    left.forEach((item, index) => assertShape(item, right[index], `${path}[${index}]`));
    return;
  }
  if (left && typeof left === "object") {
    assert.ok(right && typeof right === "object", path);
    for (const key of Object.keys(left)) {
      assert.ok(key in (right as object), `${path}.${key}`);
      assertShape((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key], `${path}.${key}`);
    }
  }
}
