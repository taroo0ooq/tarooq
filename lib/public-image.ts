import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { PostInputError } from "./post-draft";

const publicDir = path.join(process.cwd(), "public");
const types: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export function readPublicImage(imagePath: string) {
  const value = imagePath.trim();
  if (!value.startsWith("/") || value.includes("\\") || value.includes("\0")) {
    throw new PostInputError("Image path is invalid.");
  }
  const relative = value.slice(1);
  const parts = relative.split("/");
  if (!relative || parts.some((part) => part === "" || part === "." || part === "..")) {
    throw new PostInputError("Image path is invalid.");
  }
  const full = path.resolve(publicDir, relative);
  if (full !== publicDir && !full.startsWith(publicDir + path.sep)) {
    throw new PostInputError("Image path is invalid.");
  }
  if (!existsSync(full)) throw new PostInputError("The cover image could not be read.");
  const ext = path.extname(full).toLowerCase();
  const contentType = types[ext];
  if (!contentType) throw new PostInputError("The cover image must be a PNG, JPEG, or WebP file.");
  const bytes = readFileSync(full);
  if (statSync(full).size > 10 * 1024 * 1024) throw new PostInputError("The cover image is too large for LinkedIn.");
  return { bytes, contentType };
}
