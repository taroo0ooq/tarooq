import type { Metadata } from "next";
import { PostsIndex } from "@/components/pages/PostsIndex";
import { getCopy } from "@/lib/copy";
import { loadPublicPosts } from "@/lib/published-posts";
import { pageMetadata } from "@/lib/site";

const copy = getCopy("ar");

export const revalidate = 10;

export const metadata: Metadata = pageMetadata("/ar/posts", {
  title: copy.ui.meta.postsTitle,
  description: copy.ui.meta.postsDescription,
});

type PageProps = { searchParams: Promise<{ pillar?: string }> };

export default async function Page({ searchParams }: PageProps) {
  const { pillar } = await searchParams;
  const posts = await loadPublicPosts();
  return <PostsIndex locale="ar" posts={posts} pillar={pillar} />;
}
