import { appendFileSync, readFileSync } from "node:fs";
import { createVerifiedGit } from "../lib/verified-git.ts";
import { parsePublishPayload } from "../lib/publish-plan.ts";

const token = process.env.GH_TOKEN || "";
if (!token) {
  console.error("GH_TOKEN is required. Pass the Actions token so GitHub signs the commit.");
  process.exit(1);
}

const raw = process.env.PUBLISH_PAYLOAD_FILE
  ? readFileSync(process.env.PUBLISH_PAYLOAD_FILE, "utf8")
  : process.env.PUBLISH_PAYLOAD || "";

let payload;
try {
  payload = parsePublishPayload(JSON.parse(raw));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const git = createVerifiedGit(token);
const result = await git.commitPrepared(payload);
const output = process.env.GITHUB_OUTPUT;
if (output && /^[a-f0-9]{40}$/.test(result.sha)) appendFileSync(output, `sha=${result.sha}\n`);
if (!result.sha) {
  console.error("GitHub did not return a commit id.");
  process.exit(1);
}
console.log(result.created ? `Created verified commit ${result.sha}` : `Post is already on main at ${result.sha}`);
