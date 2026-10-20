import { PostInputError } from "./post-draft";

const REPO = "taroo0ooq/tarooq";
const API = "https://api.github.com";

export type GitFile = { path: string; bytes: Buffer };

export type GitHubClient = {
  listPostFiles(): Promise<{ mdx: string[]; images: string[] }>;
  commit(message: string, files: GitFile[]): Promise<{ sha: string }>;
};

type FetchImpl = typeof fetch;

function redact(value: string, token: string) {
  return token ? value.split(token).join("[redacted]") : value;
}

function assertSafePath(filePath: string) {
  if (!/^(?:content\/posts\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.mdx|public\/posts\/[a-z0-9-]+\.(?:png|jpg|webp))$/.test(filePath)) {
    throw new PostInputError("Refusing to write outside the posts directories.");
  }
}

async function github(token: string, path: string, fetchImpl: FetchImpl, init: RequestInit = {}) {
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
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}: ${redact(text, token).slice(0, 240)}`);
  }
  if (!text) return {} as Record<string, unknown>;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`GitHub returned ${response.status} with invalid JSON.`);
  }
}

type Snapshot = { commitSha: string; treeSha: string; paths: Set<string> };

async function readMain(token: string, fetchImpl: FetchImpl): Promise<Snapshot> {
  const ref = await github(token, `/repos/${REPO}/git/ref/heads/main`, fetchImpl);
  const commitSha = String((ref.object as { sha?: string } | undefined)?.sha || "");
  if (!commitSha) throw new Error("GitHub did not return the main branch.");
  const commit = await github(token, `/repos/${REPO}/git/commits/${commitSha}`, fetchImpl);
  const treeSha = String((commit.tree as { sha?: string } | undefined)?.sha || "");
  if (!treeSha) throw new Error("GitHub did not return the main tree.");
  const tree = await github(token, `/repos/${REPO}/git/trees/${treeSha}?recursive=1`, fetchImpl);
  if (tree.truncated === true) throw new Error("GitHub returned a truncated file list.");
  const paths = new Set<string>();
  const entries = Array.isArray(tree.tree) ? tree.tree : [];
  for (const entry of entries) {
    const item = entry as { path?: string; type?: string };
    if (item.type === "blob" && item.path) paths.add(item.path);
  }
  return { commitSha, treeSha, paths };
}

export function createGitHubClient(token: string, fetchImpl: FetchImpl = fetch): GitHubClient {
  return {
    async listPostFiles() {
      const snapshot = await readMain(token, fetchImpl);
      const mdx: string[] = [];
      const images: string[] = [];
      for (const filePath of snapshot.paths) {
        if (filePath.startsWith("content/posts/") && filePath.endsWith(".mdx")) mdx.push(filePath.slice("content/posts/".length));
        if (filePath.startsWith("public/posts/")) images.push(filePath.slice("public/posts/".length));
      }
      return { mdx, images };
    },
    async commit(message, files) {
      if (files.length === 0) throw new PostInputError("Nothing to commit.");
      for (const file of files) assertSafePath(file.path);
      const snapshot = await readMain(token, fetchImpl);
      for (const file of files) {
        if (snapshot.paths.has(file.path)) throw new Error(`Refusing to overwrite ${file.path}.`);
      }
      const treeEntries = [];
      for (const file of files) {
        const blob = await github(token, `/repos/${REPO}/git/blobs`, fetchImpl, {
          method: "POST",
          body: JSON.stringify({ content: file.bytes.toString("base64"), encoding: "base64" }),
        });
        const sha = String(blob.sha || "");
        if (!sha) throw new Error("GitHub did not return a blob id.");
        treeEntries.push({ path: file.path, mode: "100644", type: "blob", sha });
      }
      const tree = await github(token, `/repos/${REPO}/git/trees`, fetchImpl, {
        method: "POST",
        body: JSON.stringify({ base_tree: snapshot.treeSha, tree: treeEntries }),
      });
      const treeSha = String(tree.sha || "");
      if (!treeSha) throw new Error("GitHub did not return a tree id.");
      const commit = await github(token, `/repos/${REPO}/git/commits`, fetchImpl, {
        method: "POST",
        body: JSON.stringify({ message, tree: treeSha, parents: [snapshot.commitSha] }),
      });
      const sha = String(commit.sha || "");
      if (!sha) throw new Error("GitHub did not return a commit id.");
      await github(token, `/repos/${REPO}/git/refs/heads/main`, fetchImpl, {
        method: "PATCH",
        body: JSON.stringify({ sha }),
      });
      return { sha };
    },
  };
}

export function githubClientFromEnv() {
  const token = process.env.GITHUB_CONTENTS_TOKEN || "";
  if (!token) throw new PostInputError("GITHUB_CONTENTS_TOKEN is not set.", 500);
  return createGitHubClient(token);
}
