import Link from "next/link";
import { Readex_Pro } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { PostCover } from "@/components/PostCover";
import { tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";
import { pillarForSlug } from "@/lib/pillars";
import { postCanonicalPath, postLanguage } from "@/lib/post-locale";
import { formatPostDate, type PostMeta } from "@/lib/posts";
import { blogPostingLd, pageBreadcrumbs } from "@/lib/structured-data";

const arabic = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
  variable: "--font-arabic",
});

export function PostArticle({ post, locale }: { post: PostMeta; locale: Locale }) {
  const { pillars, ui } = getCopy(locale);
  const text = (value: string) => tx(locale, value);
  const linkedinHref = post.linkedinUrl || (post.linkedinUrn ? `https://www.linkedin.com/feed/update/${post.linkedinUrn}` : "");
  const postLocale = postLanguage(post.lang);
  const arabicPost = postLocale === "ar";
  const pillar = pillars.find((item) => item.id === pillarForSlug(post.slug));

  return (
    <main className="page">
      <JsonLd data={blogPostingLd(post)} />
      <JsonLd
        data={pageBreadcrumbs(locale, "posts", { home: ui.nav.home, current: ui.nav.posts }, {
          name: post.title,
          path: postCanonicalPath(post.slug, post.lang),
        })}
      />
      <article className={arabicPost ? `${arabic.variable} article-ar` : undefined} lang={postLocale} dir={arabicPost ? "rtl" : "ltr"}>
        <header className="page-head">
          <p className="eyebrow">
            <time dateTime={post.date}>{formatPostDate(post.date, postLocale)}</time>
            {pillar ? <span className="pillar-mark">{text(pillar.label)}</span> : null}
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
