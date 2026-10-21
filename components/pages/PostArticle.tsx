import Link from "next/link";
import { Readex_Pro } from "next/font/google";
import { PostCover } from "@/components/PostCover";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";
import { personId } from "@/lib/person-schema";
import { postCanonicalPath, postLanguage } from "@/lib/post-locale";
import { formatPostDate, type PostMeta } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";

const arabic = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
  variable: "--font-arabic",
});

export function PostArticle({ post, locale }: { post: PostMeta; locale: Locale }) {
  const { ui } = getCopy(locale);
  const linkedinHref = post.linkedinUrl || (post.linkedinUrn ? `https://www.linkedin.com/feed/update/${post.linkedinUrn}` : "");
  const postLocale = postLanguage(post.lang);
  const postUrl = absoluteUrl(postCanonicalPath(post.slug, post.lang));
  const arabicPost = postLocale === "ar";
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: postLocale,
    url: postUrl,
    mainEntityOfPage: postUrl,
    author: {
      "@type": "Person",
      "@id": personId,
    },
  };
  if (post.image) jsonLd.image = absoluteUrl(post.image);

  return (
    <main className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className={arabicPost ? `${arabic.variable} article-ar` : undefined} lang={postLocale} dir={arabicPost ? "rtl" : "ltr"}>
        <header className="page-head">
          <p className="eyebrow">
            <time dateTime={post.date}>{formatPostDate(post.date, postLocale)}</time>
          </p>
          <h1 className="serif">{post.title}</h1>
          {post.description ? <p>{post.description}</p> : null}
        </header>
        {post.image ? (
          <figure className="post-figure">
            <PostCover
              src={post.image}
              alt={post.imageAlt || post.title}
              sizes="(max-width: 900px) 88vw, 820px"
              priority
            />
          </figure>
        ) : null}
        <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        {post.linkedinUrn ? (
          <div className="embed" dir="ltr">
            <iframe title={ui.posts.linkedinFrame} src={`https://www.linkedin.com/embed/feed/update/${post.linkedinUrn}`} height={560} />
            {linkedinHref ? (
              <p>
                <a href={linkedinHref}>{ui.posts.linkedin}</a>
              </p>
            ) : null}
          </div>
        ) : null}
        <p className="note">
          <Link href={localizePath("/posts", locale)}>{ui.posts.all}</Link>
        </p>
      </article>
    </main>
  );
}
