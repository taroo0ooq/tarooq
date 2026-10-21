import type { MetadataRoute } from "next";
import { localizePath } from "./locale";
import { postCanonicalPath, postLanguage } from "./post-locale";
import { absoluteUrl } from "./site";

function localized(path: string, lastModified?: string): MetadataRoute.Sitemap {
  const alternates = {
    languages: {
      en: absoluteUrl(path),
      ar: absoluteUrl(localizePath(path, "ar")),
      "x-default": absoluteUrl(path),
    },
  };
  const shared = lastModified ? { lastModified, alternates } : { alternates };
  return [
    { url: absoluteUrl(path), ...shared },
    { url: absoluteUrl(localizePath(path, "ar")), ...shared },
  ];
}

export function postSitemapEntry(post: { slug: string; date: string; lang: string }): MetadataRoute.Sitemap[number] {
  const language = postLanguage(post.lang);
  const url = absoluteUrl(postCanonicalPath(post.slug, post.lang));
  return {
    url,
    lastModified: post.date,
    alternates: {
      languages: {
        [language]: url,
        "x-default": url,
      },
    },
  };
}

export function buildSitemap(posts: { slug: string; date: string; lang: string }[]): MetadataRoute.Sitemap {
  return [
    ...localized("/"),
    ...localized("/for-you"),
    ...localized("/business"),
    ...localized("/posts"),
    ...posts.map((post) => postSitemapEntry(post)),
    ...localized("/contact"),
    ...localized("/privacy"),
  ];
}
