import { PostInputError } from "./post-draft";

export const PUBLISH_EVENT = "publish-post";
export const LINKEDIN_RECORD_MESSAGE = "chore: record LinkedIn post ids [linkedin]";
export const WORKFLOW_URL = "https://github.com/taroo0ooq/tarooq/actions/workflows/publish-linkedin.yml";

const SHA = /^[a-f0-9]{40}$/;
const POST_PATH = /^content\/posts\/(\d{4}-\d{2}-\d{2}-[a-z0-9-]+)\.mdx$/;
const IMAGE_PATH = /^public\/posts\/[a-z0-9-]+\.(?:png|jpg|webp)$/;
const SLUG = /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/;

export type PublishFile = { path: string; sha: string };

export type PublishDispatch = {
  message: string;
  slug: string;
  files: PublishFile[];
};

export type Claim =
  | { state: "posting" }
  | { state: "posted"; urn: string; url: string };

export type LinkedInDecision = "skip" | "post" | "recover" | "refuse";

export function assertSafePath(filePath: string) {
  if (!POST_PATH.test(filePath) && !IMAGE_PATH.test(filePath)) {
    throw new PostInputError("Refusing to write outside the posts directories.");
  }
}

export function assertPublishMessage(message: string) {
  if (
    !message.startsWith("Post: ")
    || message.length > 200
    || message.includes("\n")
    || message.includes("\r")
    || message.toLowerCase().includes("[linkedin]")
  ) {
    throw new PostInputError("Refusing this commit message.");
  }
}

export function assertClaimSlug(slug: string) {
  if (!SLUG.test(slug)) throw new PostInputError("Invalid post slug.");
}

export function parsePublishPayload(value: unknown): PublishDispatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PostInputError("Publish payload must be an object.");
  const record = value as Record<string, unknown>;
  if (typeof record.message !== "string") throw new PostInputError("Publish payload is missing a message.");
  assertPublishMessage(record.message);
  if (typeof record.slug !== "string") throw new PostInputError("Publish payload slug is invalid.");
  assertClaimSlug(record.slug);
  if (!Array.isArray(record.files) || record.files.length < 1 || record.files.length > 2) {
    throw new PostInputError("Publish payload must include the post and at most one image.");
  }
  const files: PublishFile[] = [];
  for (const entry of record.files) {
    if (!entry || typeof entry !== "object") throw new PostInputError("Publish payload file is invalid.");
    const file = entry as { path?: unknown; sha?: unknown };
    if (typeof file.path !== "string" || typeof file.sha !== "string" || !SHA.test(file.sha)) {
      throw new PostInputError("Publish payload file is invalid.");
    }
    assertSafePath(file.path);
    files.push({ path: file.path, sha: file.sha });
  }
  const posts = files.filter((file) => file.path.endsWith(".mdx"));
  const images = files.filter((file) => !file.path.endsWith(".mdx"));
  if (posts.length !== 1) throw new PostInputError("Publish payload must include one post.");
  const slug = POST_PATH.exec(posts[0].path)?.[1] ?? "";
  if (slug !== record.slug) throw new PostInputError("Publish payload slug does not match the post.");
  const short = slug.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  if (images.length === 1 && !images[0].path.startsWith(`public/posts/${short}.`)) {
    throw new PostInputError("Image path does not match the post.");
  }
  return { message: record.message, slug, files };
}

export function parseClaim(text: string): Claim {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("LinkedIn claim is unreadable.");
  }
  if (!value || typeof value !== "object") throw new Error("LinkedIn claim is unreadable.");
  const record = value as { state?: unknown; urn?: unknown; url?: unknown };
  if (record.state === "posting") return { state: "posting" };
  if (
    record.state === "posted"
    && typeof record.urn === "string"
    && record.urn.startsWith("urn:")
    && typeof record.url === "string"
    && record.url.startsWith("https://www.linkedin.com/")
  ) {
    return { state: "posted", urn: record.urn, url: record.url };
  }
  throw new Error("LinkedIn claim is unreadable.");
}

export function decideLinkedIn(status: string, urn: string, claim: Claim | null): LinkedInDecision {
  if (urn || status === "posted") return "skip";
  if (status !== "ready") return "skip";
  if (claim?.state === "posted") return "recover";
  if (claim?.state === "posting") return "refuse";
  return "post";
}

export function isDefiniteLinkedInRejection(status: number) {
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}
