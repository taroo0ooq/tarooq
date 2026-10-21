import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function shouldIgnoreVercelBuild(subject) {
  return String(subject).includes("[linkedin]");
}

function main() {
  let subject = "";
  try {
    subject = execFileSync("git", ["log", "-1", "--pretty=%s"], { encoding: "utf8" });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
  if (shouldIgnoreVercelBuild(subject)) {
    console.log("Skipping the Vercel build for a LinkedIn id commit.");
    process.exit(0);
  }
  console.log("Continuing the Vercel build.");
  process.exit(1);
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entry) main();
