import { readFileSync } from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "content/llms.txt");

export function llmsBody() {
  return readFileSync(file);
}

export function llmsResponse() {
  return new Response(llmsBody(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
