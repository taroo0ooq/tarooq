import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  const urls = [
    absoluteUrl("/"),
    absoluteUrl("/for-you"),
    absoluteUrl("/business"),
    absoluteUrl("/posts"),
    ...posts.map((post) => absoluteUrl(`/posts/${post.slug}`)),
    absoluteUrl("/contact"),
    absoluteUrl("/privacy"),
  ];

  return urls.map((url) => {
    const post = posts.find((entry) => url.endsWith(`/posts/${entry.slug}`));
    return post ? { url, lastModified: post.date } : { url };
  });
}
