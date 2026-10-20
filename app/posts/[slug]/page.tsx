import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { profile } from "@/lib/content";
import { formatPostDate, getPost, getPosts } from "@/lib/posts";
import { absoluteUrl, pageMetadata } from "@/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return pageMetadata(`/posts/${slug}`, { title: "Post" });
  return pageMetadata(`/posts/${post.slug}`, {
    title: post.title,
    description: post.description,
    openGraph: {
      type: "article",
      publishedTime: post.date,
    },
  });
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const linkedinHref = post.linkedinUrl || (post.linkedinUrn ? `https://www.linkedin.com/feed/update/${post.linkedinUrn}` : "");
  const postUrl = absoluteUrl(`/posts/${post.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: postUrl,
    mainEntityOfPage: postUrl,
    author: {
      "@type": "Person",
      name: profile.name,
      url: absoluteUrl("/"),
    },
  };

  return (
    <main className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <header className="page-head">
          <p className="eyebrow">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          </p>
          <h1 className="serif">{post.title}</h1>
          {post.description ? <p>{post.description}</p> : null}
        </header>
        <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        {post.linkedinUrn ? (
          <div className="embed">
            <iframe title="LinkedIn post" src={`https://www.linkedin.com/embed/feed/update/${post.linkedinUrn}`} height={560} />
            {linkedinHref ? <p><a href={linkedinHref}>View on LinkedIn</a></p> : null}
          </div>
        ) : null}
        <p className="note">
          <Link href="/posts">All posts</Link>
        </p>
      </article>
    </main>
  );
}
