import { githubClientFromEnv, WORKFLOW_URL, type GitFile, type GitHubClient } from "./github-contents";
import { cleanAlt, readImage, type ImageExt } from "./post-image";
import {
  alignPostUrl,
  BODY_LIMIT,
  buildPostMarkdown,
  commitMessage,
  DESCRIPTION_LIMIT,
  pickSlug,
  PostInputError,
  riyadhDate,
  statusNote,
  TITLE_LIMIT,
} from "./post-draft";
import { absoluteUrl } from "./site-url.mjs";

export type PostDraft = {
  title: string;
  description: string;
  lang: "en" | "ar";
  body: string;
  linkedinText: string;
  imageAlt: string;
  linkedin: boolean;
  image: { bytes: Buffer; ext: ImageExt } | null;
};

export type PublishResult = {
  slug: string;
  url: string;
  commitUrl: string;
  queued: boolean;
  linkedinStatus: "ready" | "hold";
  note: string;
};

function oneLine(value: string, label: string, limit: number) {
  const text = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!text) throw new PostInputError(`${label} is required.`);
  if (text.includes("\n")) throw new PostInputError(`${label} must be one line.`);
  if (text.length > limit) throw new PostInputError(`${label} must be ${limit} characters or fewer.`);
  return text;
}

function publishChoice(value: string) {
  const choice = value.trim().toLowerCase();
  if (choice === "both" || choice === "linkedin" || choice === "site+linkedin" || choice === "site and linkedin") return true;
  if (choice === "site" || choice === "site-only" || choice === "hold") return false;
  throw new PostInputError('Choose publish "site" or "both".');
}

export function normalizeDraft(input: {
  title: string;
  description: string;
  lang: string;
  body: string;
  linkedinText: string;
  imageAlt: string;
  publish: string;
  image: { bytes: Buffer; filename?: string; contentType?: string } | null;
}): PostDraft {
  const lang = input.lang.trim().toLowerCase();
  if (lang !== "en" && lang !== "ar") throw new PostInputError('Language must be "en" or "ar".');
  const linkedin = publishChoice(input.publish);
  const body = input.body.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!body) throw new PostInputError("Body is required.");
  if (body.length > BODY_LIMIT) throw new PostInputError(`Body must be ${BODY_LIMIT} characters or fewer.`);
  const linkedinText = input.linkedinText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const image = readImage(input.image, linkedin);
  return {
    title: oneLine(input.title, "Title", TITLE_LIMIT),
    description: oneLine(input.description, "Description", DESCRIPTION_LIMIT),
    lang,
    body,
    linkedinText,
    imageAlt: cleanAlt(input.imageAlt, Boolean(image)),
    linkedin,
    image,
  };
}

function stringField(value: unknown) {
  return typeof value === "string" ? value : "";
}

function imageFromJson(record: Record<string, unknown>) {
  const nested = record.image;
  if (nested && typeof nested === "object") {
    const image = nested as Record<string, unknown>;
    const data = stringField(image.data);
    if (!data) return null;
    return decodeImage(data, stringField(image.filename), stringField(image.contentType));
  }
  const data = stringField(record.imageBase64);
  if (!data) return null;
  return decodeImage(data, stringField(record.imageFilename), stringField(record.imageContentType));
}

function decodeImage(data: string, filename: string, contentType: string) {
  const payload = data.replace(/^data:[^,]+,/, "").trim();
  if (payload.length > 8 * 1024 * 1024) throw new PostInputError("Image must be 4 MB or smaller.", 413);
  const bytes = Buffer.from(payload, "base64");
  if (bytes.length === 0) throw new PostInputError("Image data is empty.");
  return { bytes, filename, contentType };
}

export function draftFromJson(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PostInputError("Expected a JSON object.");
  const record = value as Record<string, unknown>;
  const linkedinFlag = record.linkedin === true ? "both" : record.linkedin === false ? "site" : "";
  return normalizeDraft({
    title: stringField(record.title),
    description: stringField(record.description),
    lang: stringField(record.lang),
    body: stringField(record.body),
    linkedinText: stringField(record.linkedinText),
    imageAlt: stringField(record.imageAlt),
    publish: stringField(record.publish) || linkedinFlag,
    image: imageFromJson(record),
  });
}

export async function draftFromFormData(form: FormData) {
  const file = form.get("image");
  let image: { bytes: Buffer; filename?: string; contentType?: string } | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > 4 * 1024 * 1024) throw new PostInputError("Image must be 4 MB or smaller.", 413);
    image = {
      bytes: Buffer.from(await file.arrayBuffer()),
      filename: file.name,
      contentType: file.type,
    };
  }
  return normalizeDraft({
    title: String(form.get("title") ?? ""),
    description: String(form.get("description") ?? ""),
    lang: String(form.get("lang") ?? ""),
    body: String(form.get("body") ?? ""),
    linkedinText: String(form.get("linkedinText") ?? ""),
    imageAlt: String(form.get("imageAlt") ?? ""),
    publish: String(form.get("publish") ?? ""),
    image,
  });
}

async function publishOnce(draft: PostDraft, client: GitHubClient, now: Date, origin: string) {
  const date = riyadhDate(now);
  const existing = await client.listPostFiles();
  const slug = pickSlug(draft.title, date, existing.mdx, existing.images);
  const linkedinText = alignPostUrl(draft.linkedinText, origin, date, slug);
  const pageSlug = `${date}-${slug}`;
  const imagePath = draft.image ? `/posts/${slug}.${draft.image.ext}` : "";
  const markdown = buildPostMarkdown({
    title: draft.title,
    description: draft.description,
    date,
    lang: draft.lang,
    body: draft.body,
    linkedinText,
    linkedin: draft.linkedin,
    image: imagePath,
    imageAlt: draft.imageAlt,
  });
  const files: GitFile[] = [{ path: `content/posts/${pageSlug}.mdx`, bytes: Buffer.from(markdown, "utf8") }];
  if (draft.image) {
    files.push({ path: `public/posts/${slug}.${draft.image.ext}`, bytes: draft.image.bytes });
  }
  const committed = await client.commit(commitMessage(draft.title), files);
  const queued = committed.queued === true || !committed.sha;
  return {
    slug: pageSlug,
    url: `${origin}/posts/${pageSlug}`,
    commitUrl: queued ? WORKFLOW_URL : `https://github.com/taroo0ooq/tarooq/commit/${committed.sha}`,
    queued,
    linkedinStatus: draft.linkedin ? "ready" as const : "hold" as const,
    note: statusNote(draft.linkedin),
  };
}

export async function publishDraft(draft: PostDraft, deps: { client?: GitHubClient; now?: Date; origin?: string } = {}): Promise<PublishResult> {
  const client = deps.client ?? githubClientFromEnv();
  const now = deps.now ?? new Date();
  const origin = (deps.origin ?? absoluteUrl("/")).replace(/\/$/, "");
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await publishOnce(draft, client, now, origin);
    } catch (error) {
      if (error instanceof PostInputError) throw error;
      lastError = error instanceof Error ? error : new Error("Could not publish the post.");
    }
  }
  throw lastError ?? new Error("Could not publish the post.");
}
