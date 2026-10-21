import { randomBytes } from "node:crypto";
import { PDF_INLINE_LIMIT, PDF_LIMIT, PostInputError } from "./post-draft";

export const DOCUMENT_BUCKET = "post-documents";
const DOCUMENT_PATH = /^documents\/[a-f0-9]{32}\.pdf$/;

export function newDocumentPath() {
  return `documents/${randomBytes(16).toString("hex")}.pdf`;
}

export function assertDocumentPath(path: string) {
  if (!DOCUMENT_PATH.test(path)) throw new PostInputError("Document path is invalid.");
}

export function assertPdf(bytes: Buffer) {
  if (bytes.length < 5 || bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new PostInputError("The file is not a PDF.");
  }
  if (bytes.length > PDF_LIMIT) throw new PostInputError("The PDF must be 100 MB or smaller.", 413);
}

export function assertInlinePdf(bytes: Buffer) {
  if (bytes.length >= PDF_INLINE_LIMIT) {
    throw new PostInputError("A PDF in the request must be under 3 MB. Upload it directly instead.", 413);
  }
  assertPdf(bytes);
}

export function assertDocumentUploadRequest(input: { size: number; contentType: string }) {
  const type = input.contentType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (type !== "application/pdf") throw new PostInputError("The file must be a PDF.");
  if (!Number.isFinite(input.size) || input.size <= 0) throw new PostInputError("PDF is empty.");
  if (input.size > PDF_LIMIT) throw new PostInputError("The PDF must be 100 MB or smaller.", 413);
}

export function absoluteStorageUrl(supabaseUrl: string, returned: string) {
  if (/^https?:\/\//i.test(returned)) return returned;
  const path = returned.startsWith("/") ? returned : `/${returned}`;
  const base = supabaseUrl.replace(/\/$/, "");
  if (path.startsWith("/storage/v1/")) return `${base}${path}`;
  return `${base}/storage/v1${path}`;
}

export function assertSignedUploadUrl(signedUrl: string, supabaseUrl: string) {
  let url: URL;
  let base: URL;
  try {
    url = new URL(signedUrl);
    base = new URL(supabaseUrl);
  } catch {
    throw new PostInputError("Supabase did not return an upload URL.", 502);
  }
  if (url.protocol !== base.protocol || url.hostname !== base.hostname || url.port !== base.port) {
    throw new PostInputError("Supabase returned an unexpected upload URL.", 502);
  }
  if (!url.pathname.includes("/object/upload/sign/") && !url.pathname.includes("/object/sign/upload/")) {
    throw new PostInputError("Supabase returned an unexpected upload URL.", 502);
  }
}
