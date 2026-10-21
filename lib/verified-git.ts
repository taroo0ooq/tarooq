import { PostInputError } from "./post-draft";
import {
  LINKEDIN_RECORD_MESSAGE,
  PUBLISH_EVENT,
  assertClaimSlug,
  assertPublishMessage,
  assertSafePath,
  parseClaim,
  parsePublishPayload,
  type Claim,
  type PublishDispatch,
  type PublishFile,
} from "./publish-plan";

export const REPO = "taroo0ooq/tarooq";
const API = "https://api.github.com";
const IMAGE_BYTE_LIMIT = 4 * 1024 * 1024;
const POST_BYTE_LIMIT = 200_000;

export class GitHubRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GitHubRequestError";
    this.status = status;
  }
}

export class ClaimExistsError extends Error {
  constructor() {
    super("A LinkedIn claim for this post already exists.");
    this.name = "ClaimExistsError";
  }
}

export type GitFile = { path: string; bytes: Buffer };

type FetchImpl = typeof fetch;
type Snapshot = { commitSha: string; treeSha: string; paths: Set<string> };

function redact(value: string, token: string) {
  return token ? value.split(token).join("[redacted]") : value;
}

function isNotFastForward(error: unknown) {
  return error instanceof GitHubRequestError && error.status === 422 && /fast forward/i.test(error.message);
}

function isAlreadyExists(error: unknown) {
  return error instanceof GitHubRequestError && error.status === 422 && /already exists/i.test(error.message);
}

function decodeBase64(content: string) {
  return Buffer.from(content.replace(/\s/g, ""), "base64");
}

async function github(token: string, fetchImpl: FetchImpl, path: string, init: RequestInit = {}, missingStatus = 0) {
  let response: Response;
  try {
    response = await fetchImpl(`${API}${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "tarooq-posts",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new Error("GitHub could not be reached.");
  }
  const text = await response.text();
  if (missingStatus && response.status === missingStatus) return null;
  if (!response.ok) {
    throw new GitHubRequestError(response.status, `GitHub returned ${response.status}: ${redact(text, token).slice(0, 240)}`);
  }
  if (!text) return {} as Record<string, unknown>;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`GitHub returned ${response.status} with invalid JSON.`);
  }
}

export function createVerifiedGit(token: string, fetchImpl: FetchImpl = fetch) {
  async function readMain(): Promise<Snapshot> {
    const ref = await github(token, fetchImpl, `/repos/${REPO}/git/ref/heads/main`);
    const commitSha = String((ref?.object as { sha?: string } | undefined)?.sha || "");
    if (!commitSha) throw new Error("GitHub did not return the main branch.");
    const commit = await github(token, fetchImpl, `/repos/${REPO}/git/commits/${commitSha}`);
    const treeSha = String((commit?.tree as { sha?: string } | undefined)?.sha || "");
    if (!treeSha) throw new Error("GitHub did not return the main tree.");
    const tree = await github(token, fetchImpl, `/repos/${REPO}/git/trees/${treeSha}?recursive=1`);
    if (tree?.truncated === true) throw new Error("GitHub returned a truncated file list.");
    const paths = new Set<string>();
    const entries = Array.isArray(tree?.tree) ? tree.tree : [];
    for (const entry of entries) {
      const item = entry as { path?: string; type?: string };
      if (item.type === "blob" && item.path) paths.add(item.path);
    }
    return { commitSha, treeSha, paths };
  }

  async function createBlob(bytes: Buffer) {
    const blob = await github(token, fetchImpl, `/repos/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: bytes.toString("base64"), encoding: "base64" }),
    });
    const sha = String(blob?.sha || "");
    if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("GitHub did not return a blob id.");
    return sha;
  }

  async function readBlob(sha: string) {
    const blob = await github(token, fetchImpl, `/repos/${REPO}/git/blobs/${sha}`);
    const size = Number(blob?.size ?? 0);
    const content = typeof blob?.content === "string" ? blob.content : "";
    return { size, bytes: content ? decodeBase64(content) : Buffer.alloc(0) };
  }

  async function verifyPrepared(files: PublishFile[]) {
    for (const file of files) {
      assertSafePath(file.path);
      const blob = await readBlob(file.sha);
      const limit = file.path.endsWith(".mdx") ? POST_BYTE_LIMIT : IMAGE_BYTE_LIMIT;
      if (!blob.size || blob.size > limit) throw new PostInputError("Refusing a post file of unexpected size.");
      if (file.path.endsWith(".mdx")) {
        const text = blob.bytes.toString("utf8");
        if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) throw new PostInputError("Post file is not markdown.");
        if (!text.includes("linkedinStatus:")) throw new PostInputError("Post file is missing linkedinStatus.");
      }
    }
  }

  async function commitTree(snapshot: Snapshot, message: string, files: PublishFile[]) {
    const tree = await github(token, fetchImpl, `/repos/${REPO}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: snapshot.treeSha,
        tree: files.map((file) => ({ path: file.path, mode: "100644", type: "blob", sha: file.sha })),
      }),
    });
    const treeSha = String(tree?.sha || "");
    if (!treeSha) throw new Error("GitHub did not return a tree id.");
    const commit = await github(token, fetchImpl, `/repos/${REPO}/git/commits`, {
      method: "POST",
      body: JSON.stringify({ message, tree: treeSha, parents: [snapshot.commitSha] }),
    });
    const sha = String(commit?.sha || "");
    if (!sha) throw new Error("GitHub did not return a commit id.");
    await github(token, fetchImpl, `/repos/${REPO}/git/refs/heads/main`, {
      method: "PATCH",
      body: JSON.stringify({ sha }),
    });
    return sha;
  }

  async function readRef(ref: string) {
    const body = await github(token, fetchImpl, `/repos/${REPO}/git/ref/${ref}`, {}, 404);
    if (!body) return "";
    return String((body.object as { sha?: string } | undefined)?.sha || "");
  }

  async function writeClaimCommit(parent: string, claim: Claim) {
    const blob = await createBlob(Buffer.from(JSON.stringify(claim), "utf8"));
    const tree = await github(token, fetchImpl, `/repos/${REPO}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ tree: [{ path: "claim.json", mode: "100644", type: "blob", sha: blob }] }),
    });
    const treeSha = String(tree?.sha || "");
    if (!treeSha) throw new Error("GitHub did not return a tree id.");
    const commit = await github(token, fetchImpl, `/repos/${REPO}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: "linkedin claim",
        tree: treeSha,
        parents: parent ? [parent] : [],
      }),
    });
    const sha = String(commit?.sha || "");
    if (!sha) throw new Error("GitHub did not return a commit id.");
    return sha;
  }

  async function readTextFile(filePath: string) {
    assertSafePath(filePath);
    const body = await github(token, fetchImpl, `/repos/${REPO}/contents/${filePath}?ref=main`, {}, 404);
    if (!body) return null;
    const size = Number(body.size ?? 0);
    if (size > POST_BYTE_LIMIT) throw new PostInputError("Refusing a post file of unexpected size.");
    const content = typeof body.content === "string" ? body.content : "";
    if (!content) throw new Error(`GitHub did not return ${filePath}.`);
    return decodeBase64(content).toString("utf8");
  }

  async function replaceFile(filePath: string, bytes: Buffer, message: string) {
    assertSafePath(filePath);
    if (message !== LINKEDIN_RECORD_MESSAGE) throw new PostInputError("Refusing this commit message.");
    if (bytes.length === 0 || bytes.length > POST_BYTE_LIMIT) throw new PostInputError("Refusing a post file of unexpected size.");
    const next = bytes.toString("utf8");
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const snapshot = await readMain();
      if (!snapshot.paths.has(filePath)) throw new Error(`Cannot update missing ${filePath}.`);
      const current = await readTextFile(filePath);
      if (current === next) return { sha: snapshot.commitSha, created: false };
      try {
        const sha = await createBlob(bytes);
        const committed = await commitTree(snapshot, message, [{ path: filePath, sha }]);
        return { sha: committed, created: true };
      } catch (error) {
        if (!isNotFastForward(error) || attempt === 2) throw error;
      }
    }
    throw new Error("Could not record the LinkedIn id.");
  }

  return {
    async listPostFiles() {
      const snapshot = await readMain();
      const mdx: string[] = [];
      const images: string[] = [];
      for (const filePath of snapshot.paths) {
        if (filePath.startsWith("content/posts/") && filePath.endsWith(".mdx")) mdx.push(filePath.slice("content/posts/".length));
        if (filePath.startsWith("public/posts/")) images.push(filePath.slice("public/posts/".length));
      }
      return { mdx, images };
    },

    async queuePublish(message: string, files: GitFile[]) {
      if (files.length === 0) throw new PostInputError("Nothing to commit.");
      for (const file of files) assertSafePath(file.path);
      assertPublishMessage(message);
      const snapshot = await readMain();
      for (const file of files) {
        if (snapshot.paths.has(file.path)) throw new Error(`Refusing to overwrite ${file.path}.`);
      }
      const prepared: PublishFile[] = [];
      for (const file of files) prepared.push({ path: file.path, sha: await createBlob(file.bytes) });
      const post = prepared.find((file) => file.path.endsWith(".mdx"));
      if (!post) throw new PostInputError("Publish payload must include one post.");
      const payload = parsePublishPayload({ message, slug: slugFromPostPath(post.path), files: prepared });
      const body = JSON.stringify({ event_type: PUBLISH_EVENT, client_payload: payload });
      if (body.length > 60_000) throw new Error("Publish payload is too large.");
      await github(token, fetchImpl, `/repos/${REPO}/dispatches`, { method: "POST", body });
    },

    async commitPrepared(input: PublishDispatch) {
      const payload = parsePublishPayload(input);
      await verifyPrepared(payload.files);
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const snapshot = await readMain();
        const present = payload.files.filter((file) => snapshot.paths.has(file.path));
        if (present.length === payload.files.length) return { sha: snapshot.commitSha, created: false };
        if (present.length > 0) throw new Error(`Refusing to overwrite ${present[0].path}.`);
        try {
          const sha = await commitTree(snapshot, payload.message, payload.files);
          return { sha, created: true };
        } catch (error) {
          if (!isNotFastForward(error) || attempt === 2) throw error;
        }
      }
      throw new Error("Could not commit the post.");
    },

    readTextFile,
    replaceFile,

    async readClaim(slug: string) {
      assertClaimSlug(slug);
      const commitSha = await readRef(`linkedin-claims/${slug}`);
      if (!commitSha) return null;
      const commit = await github(token, fetchImpl, `/repos/${REPO}/git/commits/${commitSha}`);
      const treeSha = String((commit?.tree as { sha?: string } | undefined)?.sha || "");
      if (!treeSha) throw new Error("LinkedIn claim has no tree.");
      const tree = await github(token, fetchImpl, `/repos/${REPO}/git/trees/${treeSha}`);
      const entries = Array.isArray(tree?.tree) ? tree.tree : [];
      const file = entries.find((entry) => (entry as { path?: string }).path === "claim.json") as { sha?: string } | undefined;
      if (!file?.sha) throw new Error("LinkedIn claim has no record.");
      const blob = await readBlob(file.sha);
      return parseClaim(blob.bytes.toString("utf8"));
    },

    async createClaim(slug: string) {
      assertClaimSlug(slug);
      const sha = await writeClaimCommit("", { state: "posting" });
      try {
        await github(token, fetchImpl, `/repos/${REPO}/git/refs`, {
          method: "POST",
          body: JSON.stringify({ ref: `refs/linkedin-claims/${slug}`, sha }),
        });
      } catch (error) {
        if (isAlreadyExists(error)) throw new ClaimExistsError();
        throw error;
      }
    },

    async writeClaim(slug: string, claim: Claim) {
      assertClaimSlug(slug);
      if (claim.state !== "posted") throw new PostInputError("Only a posted claim can be saved.");
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const parent = await readRef(`linkedin-claims/${slug}`);
        if (!parent) throw new Error("LinkedIn claim disappeared before the id was stored.");
        const sha = await writeClaimCommit(parent, claim);
        try {
          await github(token, fetchImpl, `/repos/${REPO}/git/refs/linkedin-claims/${slug}`, {
            method: "PATCH",
            body: JSON.stringify({ sha }),
          });
          return;
        } catch (error) {
          if (!isNotFastForward(error) || attempt === 2) throw error;
        }
      }
    },

    async deleteClaim(slug: string) {
      assertClaimSlug(slug);
      await github(token, fetchImpl, `/repos/${REPO}/git/refs/linkedin-claims/${slug}`, { method: "DELETE" }, 404);
    },
  };
}

export function slugFromPostPath(filePath: string) {
  const match = /^content\/posts\/(\d{4}-\d{2}-\d{2}-[a-z0-9-]+)\.mdx$/.exec(filePath);
  if (!match) throw new PostInputError("Invalid post path.");
  return match[1];
}
