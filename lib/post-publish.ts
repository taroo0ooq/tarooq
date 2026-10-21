import { assertDocumentPath, assertInlinePdf } from "./post-document";
import { cleanAlt, readImage } from "./post-image";
import {
  BODY_LIMIT,
  DESCRIPTION_LIMIT,
  DOCUMENT_TITLE_LIMIT,
  FIRST_COMMENT_LIMIT,
  parseSchedule,
  PostInputError,
  SEO_DESCRIPTION_LIMIT,
  SEO_TITLE_LIMIT,
  TITLE_LIMIT,
} from "./post-draft";
import type { LinkPlacement } from "./post-types";

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
  siteCover: { bytes: Buffer; ext: "png" | "jpg" | "webp" } | null;
  document: { bytes: Buffer } | null;
  documentPath: string;
  documentTitle: string;
  removeDocument: boolean;
  linkPlacement: LinkPlacement;
  firstComment: string;
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

function normalizePlacement(value: string): LinkPlacement {
  const placement = value.trim().toLowerCase();
  if (!placement || placement === "comment") return "comment";
  if (placement === "text") return "text";
  throw new PostInputError('Choose linkPlacement "text" or "comment".');
}

function boundedText(value: string, label: string, limit: number) {
  const text = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (text.length > limit) throw new PostInputError(`${label} must be ${limit} characters or fewer.`);
  return text;
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
  linkPlacement?: string;
  firstComment?: string;
  document?: { bytes: Buffer } | null;
  documentPath?: string;
  documentTitle?: string;
  removeDocument?: boolean;
  siteCover?: { bytes: Buffer; filename?: string; contentType?: string } | null;
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
  const documentPath = (input.documentPath ?? "").trim();
  const document = input.document ?? null;
  if (document && documentPath) throw new PostInputError("Send the PDF once, either uploaded or inline.");
  if (document) assertInlinePdf(document.bytes);
  if (documentPath) assertDocumentPath(documentPath);
  const hasDocument = Boolean(document || documentPath);
  if (input.image && input.siteCover) throw new PostInputError("Send one image.");
  if (input.image && hasDocument) throw new PostInputError("Choose an image or a PDF, not both.");
  const linkedInImage = hasDocument ? null : readImage(input.image ?? input.siteCover ?? null, linkedin);
  const siteCover = hasDocument ? readImage(input.siteCover ?? null, false) : null;
  const pageImage = siteCover ?? linkedInImage;
  const scheduledFor = intent === "schedule" ? parseSchedule(input.scheduledFor ?? "") : parseSchedule(input.scheduledFor ?? "") ;
  if (intent === "schedule" && !scheduledFor) throw new PostInputError("Choose a time to schedule the post.");
  return {
    title: oneLine(input.title, "Title", TITLE_LIMIT, true),
    description: oneLine(input.description, "Description", DESCRIPTION_LIMIT, publishing),
    lang,
    body,
    linkedinText,
    imageAlt: cleanAlt(input.imageAlt, Boolean(pageImage)),
    linkedin,
    image: linkedInImage,
    siteCover,
    document,
    documentPath,
    documentTitle: oneLine(input.documentTitle ?? "", "Document title", DOCUMENT_TITLE_LIMIT, hasDocument),
    removeDocument: input.removeDocument === true && !hasDocument,
    linkPlacement: normalizePlacement(input.linkPlacement ?? ""),
    firstComment: boundedText(input.firstComment ?? "", "First comment", FIRST_COMMENT_LIMIT),
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
  return bytesField(record, "image", "imageBase64", "imageFilename", "imageContentType");
}

function coverFromJson(record: Record<string, unknown>) {
  return bytesField(record, "cover", "coverBase64", "coverFilename", "coverContentType");
}

function decodeImage(data: string, filename: string, contentType: string) {
  const payload = data.replace(/^data:[^,]+,/, "").trim();
  if (payload.length > 8 * 1024 * 1024) throw new PostInputError("Image must be 4 MB or smaller.", 413);
  const bytes = Buffer.from(payload, "base64");
  if (bytes.length === 0) throw new PostInputError("Image data is empty.");
  return { bytes, filename, contentType };
}

function bytesField(record: Record<string, unknown>, nestedKey: string, flatKey: string, filenameKey: string, typeKey: string) {
  const nested = record[nestedKey];
  if (nested && typeof nested === "object") {
    const image = nested as Record<string, unknown>;
    const data = stringField(image.data);
    if (!data) return null;
    return decodeImage(data, stringField(image.filename), stringField(image.contentType));
  }
  const data = stringField(record[flatKey]);
  if (!data) return null;
  return decodeImage(data, stringField(record[filenameKey]), stringField(record[typeKey]));
}

function documentFromJson(record: Record<string, unknown>) {
  const path = stringField(record.documentPath).trim();
  const nested = record.document;
  let data = "";
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    data = stringField((nested as Record<string, unknown>).data);
    const contentType = stringField((nested as Record<string, unknown>).contentType);
    if (data && contentType && contentType !== "application/pdf") throw new PostInputError("The file must be a PDF.");
  }
  const flat = stringField(record.documentBase64);
  if (data && flat) throw new PostInputError("Send the PDF once, either uploaded or inline.");
  const payload = data || flat;
  if (!payload) return { document: null, documentPath: path };
  const encoded = payload.replace(/^data:[^,]+,/, "").replace(/\s/g, "");
  if (encoded.length > 4 * 1024 * 1024) {
    throw new PostInputError("A PDF in the request must be under 3 MB. Upload it directly instead.", 413);
  }
  const bytes = Buffer.from(encoded, "base64");
  return { document: { bytes }, documentPath: path };
}

export function draftFromJson(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PostInputError("Expected a JSON object.");
  const record = value as Record<string, unknown>;
  const linkedinFlag = record.linkedin === true ? "both" : record.linkedin === false ? "site" : "";
  const pdf = documentFromJson(record);
  return normalizeDraft({
    title: stringField(record.title),
    description: stringField(record.description),
    lang: stringField(record.lang),
    body: stringField(record.body),
    linkedinText: stringField(record.linkedinText),
    imageAlt: stringField(record.imageAlt),
    publish: stringField(record.publish) || stringField(record.linkedinMode) || linkedinFlag,
    image: imageFromJson(record),
    siteCover: coverFromJson(record),
    document: pdf.document,
    documentPath: pdf.documentPath,
    documentTitle: stringField(record.documentTitle),
    removeDocument: record.removeDocument === true || record.removeDocument === "1" || record.removeDocument === "true",
    linkPlacement: stringField(record.linkPlacement),
    firstComment: stringField(record.firstComment),
    seoTitle: stringField(record.seoTitle),
    seoDescription: stringField(record.seoDescription),
    intent: stringField(record.intent),
    scheduledFor: stringField(record.scheduledFor),
    removeCover: record.removeCover === true || record.removeCover === "1" || record.removeCover === "true",
  });
}

async function formImage(form: FormData, name: string) {
  const file = form.get(name);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 4 * 1024 * 1024) throw new PostInputError("Image must be 4 MB or smaller.", 413);
  return {
    bytes: Buffer.from(await file.arrayBuffer()),
    filename: file.name,
    contentType: file.type,
  };
}

export async function draftFromFormData(form: FormData) {
  const documentFile = form.get("document");
  if (documentFile instanceof File && documentFile.size > 0) {
    throw new PostInputError("Upload the PDF directly, then send documentPath.", 413);
  }
  const remove = form.get("removeCover");
  const removeDocument = form.get("removeDocument");
  return normalizeDraft({
    title: String(form.get("title") ?? ""),
    description: String(form.get("description") ?? ""),
    lang: String(form.get("lang") ?? ""),
    body: String(form.get("body") ?? ""),
    linkedinText: String(form.get("linkedinText") ?? ""),
    imageAlt: String(form.get("imageAlt") ?? ""),
    publish: String(form.get("publish") ?? form.get("linkedinMode") ?? ""),
    image: await formImage(form, "image"),
    siteCover: await formImage(form, "cover"),
    documentPath: String(form.get("documentPath") ?? ""),
    documentTitle: String(form.get("documentTitle") ?? ""),
    removeDocument: removeDocument === "1" || removeDocument === "true",
    linkPlacement: String(form.get("linkPlacement") ?? ""),
    firstComment: String(form.get("firstComment") ?? ""),
    seoTitle: String(form.get("seoTitle") ?? ""),
    seoDescription: String(form.get("seoDescription") ?? ""),
    intent: String(form.get("intent") ?? ""),
    scheduledFor: String(form.get("scheduledFor") ?? ""),
    removeCover: remove === "1" || remove === "true",
  });
}
