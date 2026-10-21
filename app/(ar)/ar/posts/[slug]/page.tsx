import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostArticle } from "@/components/pages/PostArticle";
import { postMetadata } from "@/lib/post-meta";
import { getPublishedPosts, loadPublicPosts } from "@/lib/published-posts";

export const revalidate = 10;
export const dynamicParams = true;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return postMetadata(slug, "ar");
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const post = (await loadPublicPosts()).find((item) => item.slug === slug);
  if (!post) notFound();
  return <PostArticle post={post} locale="ar" />;
}
