import type { MetadataRoute } from "next";
import { loadPublicPosts } from "@/lib/published-posts";
import { buildSitemap } from "@/lib/sitemap-data";

export const revalidate = 10;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await loadPublicPosts();
  return buildSitemap(posts);
}
