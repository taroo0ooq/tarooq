import Link from "next/link";
import { PostCover } from "@/components/PostCover";
import { tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";
import { postCanonicalPath, postLanguage } from "@/lib/post-locale";
import { formatPostDate, postsForLocale, type PostMeta } from "@/lib/posts";

export function PostsIndex({ locale, posts }: { locale: Locale; posts: PostMeta[] }) {
  const { ui } = getCopy(locale);
  const text = (value: string) => tx(locale, value);
  const visible = postsForLocale(posts, locale);
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">{ui.posts.eyebrow}</p>
        <h1 className="serif">{text(ui.posts.title)}</h1>
        <p>{text(ui.posts.intro)}</p>
      </header>
      {visible.length === 0 ? (
        <p className="note">{ui.posts.empty}</p>
      ) : (
        <div className="post-list">
          {visible.map((post) => {
            const postLocale = postLanguage(post.lang);
            return (
              <Link
                className="post-card"
                href={postCanonicalPath(post.slug, post.lang)}
                hrefLang={postLocale}
                key={post.slug}
                lang={postLocale}
                dir={postLocale === "ar" ? "rtl" : "ltr"}
              >
                {post.image ? (
                  <PostCover className="post-card-image" src={post.image} alt={post.imageAlt} sizes="(max-width: 840px) 88vw, 704px" />
                ) : null}
                <time dateTime={post.date}>{formatPostDate(post.date, postLocale)}</time>
                <span className="lang-mark" lang={postLocale}>
                  {postLocale === "ar" ? ui.posts.arabicMark : ui.posts.englishMark}
                </span>
                <h2 className="serif">{post.title}</h2>
                <p>{post.description}</p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
