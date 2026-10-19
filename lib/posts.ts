import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  linkedinText: string;
  linkedinStatus: string;
  linkedinUrn: string;
  linkedinUrl: string;
  html: string;
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(value: string) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function renderMarkdown(markdown: string) {
  const blocks = markdown.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n").filter((line) => line.length > 0);
      if (lines.length === 0) return "";
      if (lines.every((line) => /^#{1,3} /.test(line))) {
        return lines
          .map((line) => {
            const level = line.match(/^#+/)?.[0].length ?? 1;
            const tag = `h${Math.min(level + 1, 4)}`;
            return `<${tag}>${inline(line.replace(/^#{1,3} /, ""))}</${tag}>`;
          })
          .join("");
      }
      if (lines.every((line) => /^[-*] /.test(line))) {
        return `<ul>${lines.map((line) => `<li>${inline(line.replace(/^[-*] /, ""))}</li>`).join("")}</ul>`;
      }
      return `<p>${lines.map((line) => inline(line)).join("<br>")}</p>`;
    })
    .join("\n");
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
      const collected: string[] = [];
      while (index + 1 < lines.length && /^( {2}|\t)/.test(lines[index + 1])) {
        index += 1;
        collected.push(lines[index].replace(/^(?: {2}|\t)/, ""));
      }
      data[match[1]] = collected.join("\n").trim();
    } else {
      data[match[1]] = unquote(match[2]);
    }
  }
  return { data, body };
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
    linkedinText: data.linkedinText ?? "",
    linkedinStatus: data.linkedinStatus ?? "hold",
    linkedinUrn: data.linkedinUrn ?? "",
    linkedinUrl: data.linkedinUrl ?? "",
    html: renderMarkdown(body),
  };
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

export function formatPostDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
