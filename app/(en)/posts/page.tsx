import type { Metadata } from "next";
import { PostsIndex } from "@/components/pages/PostsIndex";
import { getCopy } from "@/lib/copy";
import { loadPublicPosts } from "@/lib/published-posts";
import { pageMetadata } from "@/lib/site";

const copy = getCopy("en");

export const revalidate = 10;

export const metadata: Metadata = pageMetadata("/posts", {
  title: copy.ui.meta.postsTitle,
  description: copy.ui.meta.postsDescription,
});

export default async function Page() {
  const posts = await loadPublicPosts();
  return <PostsIndex locale="en" posts={posts} />;
}
