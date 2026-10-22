import * as ar from "./content.ar";
import * as en from "./content";
import { renderLlms } from "./llms-text";
import type { PostMeta } from "./posts";

export type ChatChunk = {
  id: string;
  locale: "en" | "ar" | "both";
  source: string;
  text: string;
};

const skipKeys = new Set(["href", "image", "tone", "id", "era"]);

function collect(value: unknown, key = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (key && key !== "text" && key !== "body" && key !== "summary" && key !== "points" && key !== "items") {
      return `${key}: ${trimmed}`;
    }
    return trimmed;
  }
  if (typeof value === "number" || typeof value === "boolean") return "";
  if (Array.isArray(value)) {
    return value.map((item) => collect(item)).filter(Boolean).join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([name]) => !skipKeys.has(name))
      .map(([name, child]) => collect(child, name))
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function splitText(text: string, size = 1600) {
  const clean = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];
  const parts: string[] = [];
  let rest = clean;
  while (rest.length > size) {
    let cut = rest.lastIndexOf("\n", size);
    if (cut < size * 0.4) cut = rest.lastIndexOf(" ", size);
    if (cut < size * 0.4) cut = size;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

function chunksFrom(locale: "en" | "ar", source: string, value: unknown, id = ""): ChatChunk[] {
  const items = Array.isArray(value) && value.every((item) => item && typeof item === "object" && !Array.isArray(item))
    ? value.map((item, index) => {
        const record = item as Record<string, unknown>;
        const itemId = typeof record.id === "string" ? record.id : typeof record.org === "string" ? record.org : String(index);
        return { itemId, text: collect(item) };
      })
    : [{ itemId: id || "body", text: collect(value) }];

  const chunks: ChatChunk[] = [];
  for (const item of items) {
    splitText(item.text).forEach((part, index) => {
      chunks.push({
        id: `${locale}:${source}:${item.itemId}:${index}`,
        locale,
        source: item.itemId === "body" ? source : `${source}:${item.itemId}`,
        text: part,
      });
    });
  }
  return chunks;
}

function plainHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const pageSections = [
  "profile",
  "about",
  "stages",
  "problems",
  "expertise",
  "convictions",
  "mandates",
  "roles",
  "certifications",
  "skills",
  "languages",
  "education",
  "storyChapters",
  "courseTopics",
  "courses",
  "businessPage",
  "offers",
  "topics",
  "pillars",
  "ticker",
] as const;

function pageChunks(locale: "en" | "ar", copy: typeof en | typeof ar) {
  const chunks = pageSections.flatMap((section) => chunksFrom(locale, section, copy[section]));
  chunks.push(...chunksFrom(locale, "home", copy.ui.home));
  chunks.push(...chunksFrom(locale, "business", copy.ui.business));
  chunks.push(...chunksFrom(locale, "for-you", copy.ui.forYou));
  chunks.push(...chunksFrom(locale, "posts-index", copy.ui.posts));
  chunks.push(...chunksFrom(locale, "contact", copy.ui.contact));
  chunks.push(...chunksFrom(locale, "privacy", copy.ui.privacy.blocks));
  return chunks;
}

export function postChunks(posts: Pick<PostMeta, "slug" | "title" | "description" | "html" | "lang" | "date" | "imageAlt">[]) {
  return posts.flatMap((post) => {
    const locale = post.lang === "ar" ? "ar" : "en";
    const text = [post.title, post.date, post.description, post.imageAlt, plainHtml(post.html)].filter(Boolean).join("\n");
    return splitText(text, 1800).map((part, index) => ({
      id: `post:${post.slug}:${index}`,
      locale: locale as "en" | "ar",
      source: `post:${post.slug}`,
      text: part,
    }));
  });
}

export function buildSiteCorpus(posts: Pick<PostMeta, "slug" | "title" | "description" | "html" | "lang" | "date" | "imageAlt">[]) {
  const chunks = [...pageChunks("en", en), ...pageChunks("ar", ar), ...postChunks(posts)];
  try {
    const llms = renderLlms(
      posts.map((post) => ({ title: post.title, slug: post.slug, lang: post.lang, date: post.date })),
    ).trim();
    splitText(llms, 1800).forEach((part, index) => {
      chunks.push({ id: `llms:${index}`, locale: "both", source: "llms.txt", text: part });
    });
  } catch {
    // The file is part of the deployment. A missing copy just omits that source.
  }
  return chunks;
}
