import type { Metadata } from "next";
import { getCopy } from "./copy";
import { localizePath, type Locale } from "./locale";
import { getPublishedPost } from "./published-posts";
import { pageMetadata } from "./site";

export async function postMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const post = await getPublishedPost(slug);
  const path = localizePath(`/posts/${slug}`, locale);
  if (!post) return pageMetadata(path, { title: getCopy(locale).ui.meta.postFallbackTitle });
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.description;
  const image = post.image ? [{ url: post.image, alt: post.imageAlt || post.title }] : undefined;
  return pageMetadata(path, {
    title,
    description,
    openGraph: {
      type: "article",
      publishedTime: post.date,
      ...(image ? { images: image } : {}),
    },
    ...(image ? { twitter: { images: image } } : {}),
  });
}
