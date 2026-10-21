import type { Metadata } from "next";
import { getCopy } from "./copy";
import { localizePath, type Locale } from "./locale";
import { postCanonicalPath, postLanguage } from "./post-locale";
import { getPublishedPost } from "./published-posts";
import { absoluteUrl, pageMetadata } from "./site";

export async function postMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const post = await getPublishedPost(slug);
  if (!post) {
    return pageMetadata(localizePath(`/posts/${slug}`, locale), {
      title: getCopy(locale).ui.meta.postFallbackTitle,
    });
  }
  const path = postCanonicalPath(post.slug, post.lang);
  const language = postLanguage(post.lang);
  const canonical = absoluteUrl(path);
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.description;
  const image = post.image ? [{ url: post.image, alt: post.imageAlt || post.title }] : undefined;
  return pageMetadata(
    path,
    {
      title,
      description,
      openGraph: {
        type: "article",
        publishedTime: post.date,
        ...(image ? { images: image } : {}),
      },
      ...(image ? { twitter: { images: image } } : {}),
    },
    {
      languages: {
        [language]: canonical,
        "x-default": canonical,
      },
    },
  );
}
