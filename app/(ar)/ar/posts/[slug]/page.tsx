import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostArticle } from "@/components/pages/PostArticle";
import { postMetadata } from "@/lib/post-meta";
import { getPost, getPosts } from "@/lib/posts";

export const dynamic = "force-static";
export const dynamicParams = false;

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return postMetadata(slug, "ar");
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return <PostArticle post={post} locale="ar" />;
}
