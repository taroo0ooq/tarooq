import type { Metadata } from "next";
import { absoluteUrl, resolveSiteUrl, siteUrl } from "./site-url.mjs";

export { absoluteUrl, resolveSiteUrl, siteUrl };

const siteName = "Tareq Al-Ghazzi";

function socialTitle(title: Metadata["title"]) {
  if (typeof title !== "string" || title.length === 0) return undefined;
  return title.includes(siteName) ? title : `${title} — ${siteName}`;
}

const shareImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: siteName,
};

export function pageMetadata(path: string, metadata: Metadata = {}): Metadata {
  const canonical = absoluteUrl(path);
  const { openGraph, twitter, alternates, title, description, ...rest } = metadata;
  const branded = socialTitle(title);
  return {
    ...rest,
    title,
    description,
    alternates: { ...alternates, canonical },
    openGraph: {
      type: "website",
      siteName,
      images: [shareImage],
      ...(branded ? { title: branded } : {}),
      ...(description ? { description } : {}),
      ...openGraph,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      ...(branded ? { title: branded } : {}),
      ...(description ? { description } : {}),
      ...twitter,
    },
  };
}
