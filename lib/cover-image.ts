import { closeSync, openSync, readSync } from "node:fs";
import path from "node:path";

const publicDir = path.join(process.cwd(), "public");
const fallback = { width: 1200, height: 630 };

export function coverSize(src: string) {
  return localCoverSize(src) ?? fallback;
}

export function localCoverSize(src: string) {
  if (!src.startsWith("/") || src.startsWith("//") || src.includes("\\") || src.includes("\0")) return null;
  const relative = src.slice(1);
  const parts = relative.split("/");
  if (!relative || parts.some((part) => part === "" || part === "." || part === "..")) return null;
  const full = path.resolve(publicDir, relative);
  if (full !== publicDir && !full.startsWith(`${publicDir}${path.sep}`)) return null;
  let fd: number | null = null;
  try {
    fd = openSync(full, "r");
    const header = Buffer.alloc(32);
    const read = readSync(fd, header, 0, header.length, 0);
    if (read >= 24 && header[0] === 0x89 && header.toString("ascii", 1, 4) === "PNG") {
      return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
    }
    return null;
  } catch {
    return null;
  } finally {
    if (fd != null) closeSync(fd);
  }
}
