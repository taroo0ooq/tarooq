import type { Metadata } from "next";
import { alternatePaths, isArabicPath } from "./locale";
import { absoluteUrl, resolveSiteUrl, siteUrl } from "./site-url.mjs";

export { absoluteUrl, resolveSiteUrl, siteUrl };

const branding = {
  en: { siteName: "Tareq Al-Ghazzi", locale: "en_US", alternateLocale: ["ar_SA"] },
  ar: { siteName: "طارق الغزي", locale: "ar_SA", alternateLocale: ["en_US"] },
} as const;

function socialTitle(title: Metadata["title"], siteName: string) {
  if (typeof title !== "string" || title.length === 0) return undefined;
  return title.includes(siteName) ? title : `${title} — ${siteName}`;
}

export const defaultShareImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
} as const;

type PageMetadataOptions = {
  languages?: Record<string, string>;
};

export function pageMetadata(path: string, metadata: Metadata = {}, options: PageMetadataOptions = {}): Metadata {
  const canonical = absoluteUrl(path);
  const brand = isArabicPath(path) ? branding.ar : branding.en;
  const paths = alternatePaths(path);
  const { openGraph, twitter, alternates, title, description, ...rest } = metadata;
  const branded = socialTitle(title, brand.siteName);
  const paired = {
    en: absoluteUrl(paths.en),
    ar: absoluteUrl(paths.ar),
    "x-default": absoluteUrl(paths["x-default"]),
  };
  return {
    ...rest,
    title,
    description,
    alternates: {
      ...alternates,
      languages: options.languages ?? paired,
      canonical,
    },
    openGraph: {
      type: "website",
      images: [{ ...defaultShareImage, alt: brand.siteName }],
      ...(branded ? { title: branded } : {}),
      ...(description ? { description } : {}),
      ...openGraph,
      siteName: brand.siteName,
      locale: brand.locale,
      alternateLocale: [...brand.alternateLocale],
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      images: [defaultShareImage.url],
      ...(branded ? { title: branded } : {}),
      ...(description ? { description } : {}),
      ...twitter,
    },
  };
}
