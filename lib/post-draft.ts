export const LINKEDIN_LIMIT = 3000;
export const TITLE_LIMIT = 140;
export const DESCRIPTION_LIMIT = 400;
export const BODY_LIMIT = 20_000;
export const ALT_LIMIT = 1000;

export class PostInputError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PostInputError";
    this.status = status;
  }
}

export function riyadhDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function formatDraftDate(value: string) {
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

export function slugifyTitle(title: string) {
  const raw = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return raw.slice(0, 48).replace(/-+$/g, "");
}

export function pickSlug(title: string, date: string, mdxNames: Iterable<string>, imageNames: Iterable<string>) {
  const base = slugifyTitle(title) || "post";
  const mdx = new Set(mdxNames);
  const images = [...imageNames];
  for (let n = 1; n < 50; n += 1) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const file = `${date}-${slug}.mdx`;
    const imageClash = images.some((name) => name.startsWith(`${slug}.`));
    if (!mdx.has(file) && !imageClash) return slug;
  }
  throw new PostInputError("Could not find an unused slug.");
}

export function postUrl(origin: string, date: string, slug: string) {
  return `${origin.replace(/\/$/, "")}/posts/${date}-${slug}`;
}

export function alignPostUrl(text: string, origin: string, date: string, slug: string) {
  const url = postUrl(origin, date, slug);
  const pattern = new RegExp(`${escapeRegExp(origin.replace(/\/$/, ""))}/posts/${date}-[a-z0-9-]+`, "g");
  const replaced = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().replace(pattern, url);
  if (replaced.includes(url)) {
    if (replaced.length > LINKEDIN_LIMIT) {
      throw new PostInputError(`linkedinText is ${replaced.length} characters. The limit is ${LINKEDIN_LIMIT}.`);
    }
    return replaced;
  }
  const next = replaced ? `${replaced}\n\n${url}` : url;
  if (next.length > LINKEDIN_LIMIT) {
    throw new PostInputError(`linkedinText is ${next.length} characters once the post URL is included. The limit is ${LINKEDIN_LIMIT}.`);
  }
  return next;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function yamlQuote(value: string) {
  return JSON.stringify(value);
}

export function yamlBlock(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

export function commitMessage(title: string) {
  const flat = title.replace(/\s+/g, " ").replace(/\[linkedin\]/gi, "").trim().slice(0, 120);
  return `Post: ${flat || "untitled"}`;
}

export function statusNote(linkedin: boolean) {
  const live = "The workflow writes a verified commit on main. The post goes live on the site after the Vercel deploy.";
  const social = linkedin
    ? "LinkedIn publishes after the GitHub workflow runs, once."
    : "LinkedIn stays on hold, so the workflow will not post it.";
  return `${live} ${social}`;
}

export type PostFileInput = {
  title: string;
  description: string;
  date: string;
  lang: "en" | "ar";
  body: string;
  linkedinText: string;
  linkedin: boolean;
  image?: string;
  imageAlt?: string;
};

export function buildPostMarkdown(input: PostFileInput) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new PostInputError("Date is invalid.");
  const lines = [
    "---",
    `title: ${yamlQuote(input.title)}`,
    `date: ${input.date}`,
    `description: ${yamlQuote(input.description)}`,
  ];
  if (input.lang === "ar") lines.push("lang: ar");
  if (input.image) {
    lines.push(`image: ${yamlQuote(input.image)}`);
    if (input.imageAlt) lines.push(`imageAlt: ${yamlQuote(input.imageAlt)}`);
  }
  lines.push(`linkedinStatus: ${input.linkedin ? "ready" : "hold"}`);
  lines.push('linkedinUrn: ""');
  lines.push('linkedinUrl: ""');
  lines.push("linkedinText: |");
  lines.push(yamlBlock(input.linkedinText));
  lines.push("---", "", input.body.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim(), "");
  return lines.join("\n");
}
