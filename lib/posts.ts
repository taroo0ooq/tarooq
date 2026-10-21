import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderMarkdown } from "./markdown";

export { renderMarkdown };

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  lang: string;
  image: string;
  imageAlt: string;
  linkedinText: string;
  linkedinStatus: string;
  linkedinUrn: string;
  linkedinUrl: string;
  html: string;
  seoTitle: string;
  seoDescription: string;
};

const postsDir = path.join(process.cwd(), "content", "posts");

function unquote(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === "string" ? parsed : trimmed;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

export function parseFrontmatter(raw: string) {
  const text = raw.replace(/^\uFEFF/, "");
  if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) {
    return { data: {} as Record<string, string>, body: text };
  }
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { data: {} as Record<string, string>, body: text };
  const block = text.slice(text.indexOf("\n") + 1, end);
  const body = text.slice(end + 4).replace(/^\r?\n/, "");
  const data: Record<string, string> = {};
  const lines = block.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^([A-Za-z0-9]+):\s*(.*)$/.exec(lines[index]);
    if (!match) continue;
    if (match[2] === "|") {
      const blockValue = takeBlock(lines, index);
      index = blockValue.index;
      data[match[1]] = blockValue.value;
    } else {
      data[match[1]] = unquote(match[2]);
    }
  }
  return { data, body };
}

function takeBlock(lines: string[], index: number) {
  const collected: string[] = [];
  let indent = "";
  while (index + 1 < lines.length) {
    const next = lines[index + 1];
    if (next.trim() === "") {
      index += 1;
      collected.push("");
      continue;
    }
    const indentMatch = /^( +|\t+)/.exec(next);
    if (!indentMatch) break;
    if (!indent) indent = indentMatch[1];
    if (!next.startsWith(indent)) break;
    index += 1;
    collected.push(next.slice(indent.length));
  }
  return { value: collected.join("\n").trim(), index };
}

function readPost(fileName: string): PostMeta | null {
  if (!fileName.endsWith(".mdx")) return null;
  const slug = fileName.slice(0, -4);
  const raw = readFileSync(path.join(postsDir, fileName), "utf8");
  const { data, body } = parseFrontmatter(raw);
  if (!data.title || !data.date) return null;
  return {
    slug,
    title: data.title,
    date: data.date,
    description: data.description ?? "",
    lang: data.lang ?? "",
    image: data.image ?? "",
    imageAlt: data.imageAlt ?? "",
    linkedinText: data.linkedinText ?? "",
    linkedinStatus: data.linkedinStatus ?? "hold",
    linkedinUrn: data.linkedinUrn ?? "",
    linkedinUrl: data.linkedinUrl ?? "",
    html: renderMarkdown(body, data.lang ?? ""),
    seoTitle: data.seoTitle ?? "",
    seoDescription: data.seoDescription ?? "",
  };
}

export function postsForLocale<T extends { lang: string; date: string; slug: string }>(posts: T[], locale: "en" | "ar") {
  if (locale !== "ar") return posts;
  return [...posts].sort((a, b) => {
    const rank = (post: T) => (post.lang === "ar" ? 0 : 1);
    const byLang = rank(a) - rank(b);
    if (byLang !== 0) return byLang;
    return b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug);
  });
}

export function getPosts() {
  let names: string[] = [];
  try {
    names = readdirSync(postsDir);
  } catch {
    return [];
  }
  return names
    .map(readPost)
    .filter((post): post is PostMeta => post != null)
    .sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug));
}

export function getPost(slug: string) {
  return getPosts().find((post) => post.slug === slug) ?? null;
}

export function formatPostDate(value: string, locale: "en" | "ar" = "en") {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
