import type { Metadata } from "next";
import { Readex_Pro } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import { profile } from "@/lib/content";
import { formatPostDate, getPost, getPosts } from "@/lib/posts";
import { absoluteUrl, pageMetadata } from "@/lib/site";

const arabic = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
  variable: "--font-arabic",
});

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
  const image = post.image ? [{ url: post.image, alt: post.imageAlt || post.title }] : undefined;
  return pageMetadata(`/posts/${post.slug}`, {
    title: post.title,
    description: post.description,
    openGraph: {
      type: "article",
      publishedTime: post.date,
      ...(image ? { images: image } : {}),
    },
    ...(image ? { twitter: { images: image } } : {}),
  });
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const linkedinHref = post.linkedinUrl || (post.linkedinUrn ? `https://www.linkedin.com/feed/update/${post.linkedinUrn}` : "");
  const postUrl = absoluteUrl(`/posts/${post.slug}`);
  const arabicPost = post.lang === "ar";
  const jsonLd: Record<string, unknown> = {
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
  if (post.image) jsonLd.image = absoluteUrl(post.image);
  if (post.lang) jsonLd.inLanguage = post.lang;

  return (
    <main className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article
        className={arabicPost ? `${arabic.variable} article-ar` : undefined}
        lang={post.lang || undefined}
        dir={arabicPost ? "rtl" : undefined}
      >
        <header className="page-head">
          <p className="eyebrow">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          </p>
          <h1 className="serif">{post.title}</h1>
          {post.description ? <p>{post.description}</p> : null}
        </header>
        {post.image ? (
          <figure className="post-figure">
            <img src={post.image} alt={post.imageAlt || post.title} />
          </figure>
        ) : null}
        <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        {post.linkedinUrn ? (
          <div className="embed" dir="ltr">
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
