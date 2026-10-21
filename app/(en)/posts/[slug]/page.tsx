import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PostArticle } from "@/components/pages/PostArticle";
import { postMetadata } from "@/lib/post-meta";
import { postLanguage, postRedirectPath } from "@/lib/post-locale";
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
  return postMetadata(slug, "en");
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const post = (await loadPublicPosts()).find((item) => item.slug === slug);
  if (!post) notFound();
  const redirectTo = postRedirectPath(post.slug, post.lang, "en");
  if (redirectTo) permanentRedirect(redirectTo);
  return <PostArticle post={post} locale={postLanguage(post.lang)} />;
}
