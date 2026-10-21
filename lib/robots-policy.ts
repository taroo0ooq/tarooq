import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "./site";

export function robotsPolicy(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/linkedin/", "/posts/new"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
