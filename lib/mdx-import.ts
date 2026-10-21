import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "./posts";
import type { PostInsert } from "./post-types";

export type ImportedPost = PostInsert;

function dollarQuote(value: string, tag: string) {
  let name = tag;
  while (value.includes(`$${name}$`)) name += "x";
  return `$${name}$${value}$${name}$`;
}

export function postFromMdx(slug: string, raw: string): ImportedPost | null {
  const { data, body } = parseFrontmatter(raw);
  if (!data.title || !/^\d{4}-\d{2}-\d{2}$/.test(data.date || "")) return null;
  const posted = data.linkedinStatus === "posted" || Boolean(data.linkedinUrn);
  const share = posted || data.linkedinStatus === "ready";
  return {
    slug,
    title: data.title,
    description: data.description ?? "",
    body: body.trim(),
    lang: data.lang === "ar" ? "ar" : "en",
    status: "published",
    published_on: data.date,
    published_at: `${data.date}T00:00:00+03:00`,
    scheduled_for: null,
    cover_path: data.image ?? "",
    cover_alt: data.imageAlt ?? "",
    seo_title: data.seoTitle ?? "",
    seo_description: data.seoDescription ?? "",
    linkedin_text: data.linkedinText ?? "",
    linkedin_mode: share ? "both" : "site",
    linkedin_status: posted ? "posted" : "hold",
    linkedin_urn: data.linkedinUrn ?? "",
    linkedin_url: data.linkedinUrl ?? "",
    linkedin_error: "",
    link_placement: posted ? "text" : "comment",
    first_comment: "",
    doc_path: "",
    doc_title: "",
  };
}

export function loadMdxPosts(dir = path.join(process.cwd(), "content", "posts")) {
  let names: string[] = [];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => postFromMdx(name.slice(0, -4), readFileSync(path.join(dir, name), "utf8")))
    .filter((post): post is ImportedPost => post != null)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function insertSql(post: ImportedPost) {
  const columns = [
    "slug",
    "title",
    "description",
    "body",
    "lang",
    "status",
    "published_on",
    "published_at",
    "cover_path",
    "cover_alt",
    "seo_title",
    "seo_description",
    "linkedin_text",
    "linkedin_mode",
    "linkedin_status",
    "linkedin_urn",
    "linkedin_url",
  ];
  const values = [
    dollarQuote(post.slug, "slug"),
    dollarQuote(post.title, "title"),
    dollarQuote(post.description, "description"),
    dollarQuote(post.body, "body"),
    dollarQuote(post.lang, "lang"),
    dollarQuote(post.status, "status"),
    dollarQuote(post.published_on, "day"),
    post.published_at ? dollarQuote(post.published_at, "at") : "null",
    dollarQuote(post.cover_path, "cover"),
    dollarQuote(post.cover_alt, "alt"),
    dollarQuote(post.seo_title, "seo_title"),
    dollarQuote(post.seo_description, "seo_description"),
    dollarQuote(post.linkedin_text, "linkedin"),
    dollarQuote(post.linkedin_mode, "mode"),
    dollarQuote(post.linkedin_status, "state"),
    dollarQuote(post.linkedin_urn, "urn"),
    dollarQuote(post.linkedin_url, "url"),
  ];
  return `insert into public.posts (${columns.join(", ")})\nvalues (${values.join(", ")})\non conflict (slug) do nothing;`;
}

export function renderSeedSql(posts: ImportedPost[]) {
  const posted = posts.filter((post) => post.linkedin_urn).map((post) => dollarQuote(post.slug, "seedslug"));
  const claims = posted.length === 0
    ? ""
    : `
insert into private.linkedin_claims (post_id, state, urn, url)
select id, 'posted', linkedin_urn, linkedin_url
from public.posts
where slug in (${posted.join(", ")})
  and linkedin_urn <> ''
on conflict (post_id) do nothing;
`;
  return `-- Existing posts from content/posts. Images stay in public/posts.
-- Re-applying this seed does not overwrite a row the owner has edited.

${posts.map(insertSql).join("\n\n")}
${claims}`;
}
