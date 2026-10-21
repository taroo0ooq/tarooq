import Link from "next/link";
import { tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";
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
            const postLocale = post.lang === "ar" ? "ar" : "en";
            const showEnglish = locale === "ar" && postLocale === "en";
            return (
              <Link
                className="post-card"
                href={localizePath(`/posts/${post.slug}`, locale)}
                key={post.slug}
                lang={postLocale}
                dir={postLocale === "ar" ? "rtl" : "ltr"}
              >
                {post.image ? <img className="post-card-image" src={post.image} alt={post.imageAlt} /> : null}
                <time dateTime={post.date}>{formatPostDate(post.date, postLocale)}</time>
                {showEnglish ? (
                  <span className="lang-mark" lang="en">
                    {ui.posts.englishMark}
                  </span>
                ) : null}
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
