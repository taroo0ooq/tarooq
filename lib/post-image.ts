import { ALT_LIMIT, PostInputError } from "./post-draft";

export const IMAGE_LIMIT = 4 * 1024 * 1024;

export type ImageExt = "png" | "jpg" | "webp";

export function sniffImage(bytes: Buffer): ImageExt | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 12
    && bytes.subarray(0, 4).toString("ascii") === "RIFF"
    && bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export function filenameExt(name: string): ImageExt | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "png") return "png";
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "webp") return "webp";
  return null;
}

function typeExt(contentType: string): ImageExt | null {
  const value = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (value === "image/png") return "png";
  if (value === "image/jpeg" || value === "image/jpg") return "jpg";
  if (value === "image/webp") return "webp";
  return null;
}

export function readImage(input: { bytes: Buffer; filename?: string; contentType?: string } | null, linkedin: boolean) {
  if (!input || input.bytes.length === 0) return null;
  if (input.bytes.length > IMAGE_LIMIT) throw new PostInputError("Image must be 4 MB or smaller.", 413);
  const sniffed = sniffImage(input.bytes);
  if (!sniffed) throw new PostInputError("Image must be a PNG, JPEG, or WebP file.");
  const named = input.filename ? filenameExt(input.filename) : null;
  if (input.filename && !named) throw new PostInputError("Image must be a PNG, JPEG, or WebP file.");
  if (named && named !== sniffed) throw new PostInputError("The image contents do not match the file type.");
  const declared = input.contentType ? typeExt(input.contentType) : null;
  if (input.contentType && !declared) throw new PostInputError("Image must be a PNG, JPEG, or WebP file.");
  if (declared && declared !== sniffed) throw new PostInputError("The image contents do not match the file type.");
  if (linkedin && sniffed === "webp") {
    throw new PostInputError("LinkedIn accepts PNG or JPEG. WebP can be used for a site-only post.");
  }
  return { bytes: input.bytes, ext: sniffed };
}

export function cleanAlt(value: string, hasImage: boolean) {
  const alt = value.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
  if (hasImage && !alt) throw new PostInputError("Add alt text for the image.");
  if (alt.length > ALT_LIMIT) throw new PostInputError(`Alt text must be ${ALT_LIMIT} characters or fewer.`);
  if (alt.includes("\n")) throw new PostInputError("Alt text must be one line.");
  return alt;
}
