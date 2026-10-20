import Link from "next/link";
import { Readex_Pro } from "next/font/google";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";
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
  const { profile, ui } = getCopy(locale);
  const linkedinHref = post.linkedinUrl || (post.linkedinUrn ? `https://www.linkedin.com/feed/update/${post.linkedinUrn}` : "");
  const postUrl = absoluteUrl(localizePath(`/posts/${post.slug}`, locale));
  const postLocale = post.lang === "ar" ? "ar" : "en";
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
      name: profile.name,
      url: absoluteUrl(localizePath("/", locale)),
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
            <img src={post.image} alt={post.imageAlt || post.title} />
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
