import type { Metadata } from "next";
import { getCopy } from "./copy";
import { localizePath, type Locale } from "./locale";
import { getPost } from "./posts";
import { pageMetadata } from "./site";

export function postMetadata(slug: string, locale: Locale): Metadata {
  const post = getPost(slug);
  const path = localizePath(`/posts/${slug}`, locale);
  if (!post) return pageMetadata(path, { title: getCopy(locale).ui.meta.postFallbackTitle });
  const image = post.image ? [{ url: post.image, alt: post.imageAlt || post.title }] : undefined;
  return pageMetadata(path, {
    title: post.title,
    description: post.description,
    openGraph: {
      type: "article",
      publishedTime: post.date,
      ...(image ? { images: image } : {}),
    },
    ...(image ? { twitter: { images: image } } : {}),
  });
}
