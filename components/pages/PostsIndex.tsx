import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PostCover } from "@/components/PostCover";
import { tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";
import { isPillarId, pillarForSlug, type PillarId } from "@/lib/pillars";
import { postCanonicalPath, postLanguage } from "@/lib/post-locale";
import { formatPostDate, postsForLocale, type PostMeta } from "@/lib/posts";
import { pageBreadcrumbs } from "@/lib/structured-data";

function postsHref(locale: Locale, pillar?: PillarId) {
  const path = localizePath("/posts", locale);
  return pillar ? `${path}?pillar=${pillar}` : path;
}

export function PostsIndex({ locale, posts, pillar }: { locale: Locale; posts: PostMeta[]; pillar?: string }) {
  const { pillars, ui } = getCopy(locale);
  const text = (value: string) => tx(locale, value);
  const active = isPillarId(pillar) ? pillar : undefined;
  const visible = postsForLocale(posts, locale).filter((post) => {
    if (!active) return true;
    return pillarForSlug(post.slug) === active;
  });
  return (
    <main className="page">
      <JsonLd data={pageBreadcrumbs(locale, "posts", { home: ui.nav.home, current: ui.nav.posts })} />
      <header className="page-head">
        <p className="eyebrow">{ui.posts.eyebrow}</p>
        <h1 className="serif">{text(ui.posts.title)}</h1>
        <p>{text(ui.posts.intro)}</p>
        <nav className="pillar-filter" aria-label={ui.posts.filter}>
          <Link href={postsHref(locale)} aria-current={active ? undefined : "page"}>
            {ui.posts.allPillars}
          </Link>
          {pillars.map((item) => (
            <Link key={item.id} href={postsHref(locale, item.id)} aria-current={active === item.id ? "page" : undefined}>
              {text(item.label)}
            </Link>
          ))}
        </nav>
      </header>
      {visible.length === 0 ? (
        <p className="note">{active ? ui.posts.emptyPillar : ui.posts.empty}</p>
      ) : (
        <div className="post-list">
          {visible.map((post) => {
            const postLocale = postLanguage(post.lang);
            const postPillar = pillars.find((item) => item.id === pillarForSlug(post.slug));
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
                {postPillar ? <span className="pillar-mark">{text(postPillar.label)}</span> : null}
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
