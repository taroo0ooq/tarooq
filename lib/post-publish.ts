import { cleanAlt, readImage } from "./post-image";
import {
  BODY_LIMIT,
  DESCRIPTION_LIMIT,
  parseSchedule,
  PostInputError,
  SEO_DESCRIPTION_LIMIT,
  SEO_TITLE_LIMIT,
  TITLE_LIMIT,
} from "./post-draft";

export type SaveIntent = "draft" | "publish" | "schedule" | "unpublish";

export type PostDraft = {
  title: string;
  description: string;
  lang: "en" | "ar";
  body: string;
  linkedinText: string;
  imageAlt: string;
  linkedin: boolean;
  image: { bytes: Buffer; ext: "png" | "jpg" | "webp" } | null;
  seoTitle: string;
  seoDescription: string;
  intent: SaveIntent;
  scheduledFor: string | null;
  removeCover: boolean;
};

function oneLine(value: string, label: string, limit: number, required: boolean) {
  const text = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!text && required) throw new PostInputError(`${label} is required.`);
  if (!text) return "";
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

function normalizeIntent(value: string): SaveIntent {
  const intent = value.trim().toLowerCase();
  if (!intent) return "publish";
  if (intent === "draft" || intent === "publish" || intent === "schedule" || intent === "unpublish") return intent;
  throw new PostInputError("Choose draft, publish, schedule, or unpublish.");
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
  seoTitle?: string;
  seoDescription?: string;
  intent?: string;
  scheduledFor?: string;
  removeCover?: boolean;
}): PostDraft {
  const lang = input.lang.trim().toLowerCase();
  if (lang !== "en" && lang !== "ar") throw new PostInputError('Language must be "en" or "ar".');
  const intent = normalizeIntent(input.intent ?? "");
  const publishing = intent === "publish" || intent === "schedule";
  const linkedin = publishChoice(input.publish);
  const body = input.body.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (publishing && !body) throw new PostInputError("Body is required.");
  if (body.length > BODY_LIMIT) throw new PostInputError(`Body must be ${BODY_LIMIT} characters or fewer.`);
  const linkedinText = input.linkedinText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const image = readImage(input.image, linkedin);
  const scheduledFor = intent === "schedule" ? parseSchedule(input.scheduledFor ?? "") : parseSchedule(input.scheduledFor ?? "") ;
  if (intent === "schedule" && !scheduledFor) throw new PostInputError("Choose a time to schedule the post.");
  return {
    title: oneLine(input.title, "Title", TITLE_LIMIT, true),
    description: oneLine(input.description, "Description", DESCRIPTION_LIMIT, publishing),
    lang,
    body,
    linkedinText,
    imageAlt: cleanAlt(input.imageAlt, Boolean(image)),
    linkedin,
    image,
    seoTitle: oneLine(input.seoTitle ?? "", "SEO title", SEO_TITLE_LIMIT, false),
    seoDescription: oneLine(input.seoDescription ?? "", "SEO description", SEO_DESCRIPTION_LIMIT, false),
    intent,
    scheduledFor: intent === "draft" || intent === "unpublish" ? null : scheduledFor,
    removeCover: input.removeCover === true,
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
    publish: stringField(record.publish) || stringField(record.linkedinMode) || linkedinFlag,
    image: imageFromJson(record),
    seoTitle: stringField(record.seoTitle),
    seoDescription: stringField(record.seoDescription),
    intent: stringField(record.intent),
    scheduledFor: stringField(record.scheduledFor),
    removeCover: record.removeCover === true || record.removeCover === "1" || record.removeCover === "true",
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
  const remove = form.get("removeCover");
  return normalizeDraft({
    title: String(form.get("title") ?? ""),
    description: String(form.get("description") ?? ""),
    lang: String(form.get("lang") ?? ""),
    body: String(form.get("body") ?? ""),
    linkedinText: String(form.get("linkedinText") ?? ""),
    imageAlt: String(form.get("imageAlt") ?? ""),
    publish: String(form.get("publish") ?? form.get("linkedinMode") ?? ""),
    image,
    seoTitle: String(form.get("seoTitle") ?? ""),
    seoDescription: String(form.get("seoDescription") ?? ""),
    intent: String(form.get("intent") ?? ""),
    scheduledFor: String(form.get("scheduledFor") ?? ""),
    removeCover: remove === "1" || remove === "true",
  });
}
