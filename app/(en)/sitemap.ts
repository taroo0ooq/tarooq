import type { MetadataRoute } from "next";
import { localizePath } from "@/lib/locale";
import { loadPublicPosts } from "@/lib/published-posts";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 10;

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await loadPublicPosts();
  return [
    ...localized("/"),
    ...localized("/for-you"),
    ...localized("/business"),
    ...localized("/posts"),
    ...posts.flatMap((post) => localized(`/posts/${post.slug}`, post.date)),
    ...localized("/contact"),
    ...localized("/privacy"),
  ];
}
