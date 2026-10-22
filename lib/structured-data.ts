import { localizePath, type Locale } from "./locale";
import { personId } from "./person-schema";
import { postCanonicalPath } from "./post-locale";
import { absoluteUrl } from "./site";

export type Crumb = { name: string; path: string };

export function breadcrumbList(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

const pagePath = {
  posts: "/posts",
  business: "/business",
  contact: "/contact",
  "for-you": "/for-you",
} as const;

export function pageBreadcrumbs(
  locale: Locale,
  page: keyof typeof pagePath,
  names: { home: string; current: string },
  extra?: Crumb,
) {
  const items: Crumb[] = [
    { name: names.home, path: localizePath("/", locale) },
    { name: names.current, path: localizePath(pagePath[page], locale) },
  ];
  if (extra) items.push(extra);
  return breadcrumbList(items);
}

export function blogPostingLd(post: {
  title: string;
  description: string;
  date: string;
  lang: string;
  slug: string;
  image?: string;
}) {
  const postLocale = post.lang === "ar" ? "ar" : "en";
  const postUrl = absoluteUrl(postCanonicalPath(post.slug, post.lang));
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: postLocale,
    url: postUrl,
    mainEntityOfPage: postUrl,
    author: {
      "@type": "Person",
      "@id": personId,
    },
  };
  if (post.image) data.image = absoluteUrl(post.image);
  return data;
}
