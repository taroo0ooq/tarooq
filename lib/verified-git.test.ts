import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LINKEDIN_RECORD_MESSAGE } from "./publish-plan.ts";
import { ClaimExistsError, createVerifiedGit } from "./verified-git.ts";

const token = "actions-token-value";
const postPath = "content/posts/2026-10-21-hello.mdx";
const imagePath = "public/posts/hello.png";
const markdown = "---\nlinkedinStatus: ready\n---\n\nHello\n";

type Stored = {
  blobs: Map<string, Buffer>;
  trees: Map<string, { path: string; sha: string; type: string }[]>;
  commits: Map<string, { tree: string; parents: string[]; message: string }>;
  refs: Map<string, string>;
  ids: number;
  failMainUpdates: number;
  dispatches: unknown[];
};

function storeBlob(state: Stored, bytes: Buffer) {
  state.ids += 1;
  const sha = state.ids.toString(16).padStart(40, "a");
  state.blobs.set(sha, bytes);
  return sha;
}

function mockState(): Stored {
  const state: Stored = {
    blobs: new Map(),
    trees: new Map(),
    commits: new Map(),
    refs: new Map(),
    ids: 0,
    failMainUpdates: 0,
    dispatches: [],
  };
  const readme = storeBlob(state, Buffer.from("readme"));
  state.trees.set("tree-main", [{ path: "README.md", sha: readme, type: "blob" }]);
  state.commits.set("commit-main", { tree: "tree-main", parents: [], message: "init" });
  state.refs.set("heads/main", "commit-main");
  return state;
}

function json(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function mockFetch(state: Stored): typeof fetch {
  return async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : null;
    const path = url.pathname;
    const authorization = new Headers(init?.headers).get("authorization") ?? "";
    assert.equal(authorization, `Bearer ${token}`);

    if (method === "GET" && path.endsWith("/git/ref/heads/main")) {
      return json({ object: { sha: state.refs.get("heads/main") } });
    }
    const claimRef = path.match(/\/git\/ref\/(linkedin-claims\/[a-z0-9-]+)$/);
    if (method === "GET" && claimRef) {
      const sha = state.refs.get(claimRef[1]);
      if (!sha) return json({ message: "missing" }, 404);
      return json({ object: { sha } });
    }
    const commitMatch = path.match(/\/git\/commits\/([^/]+)$/);
    if (method === "GET" && commitMatch) {
      const commit = state.commits.get(commitMatch[1]);
      if (!commit) return json({ message: "missing commit" }, 404);
      return json({ tree: { sha: commit.tree }, parents: commit.parents, message: commit.message });
    }
    const treeMatch = path.match(/\/git\/trees\/([^/]+)$/);
    if (method === "GET" && treeMatch) {
      return json({ truncated: false, tree: state.trees.get(treeMatch[1]) ?? [] });
    }
    const blobMatch = path.match(/\/git\/blobs\/([^/]+)$/);
    if (method === "GET" && blobMatch) {
      const bytes = state.blobs.get(blobMatch[1]);
      if (!bytes) return json({ message: "missing blob" }, 404);
      return json({ sha: blobMatch[1], size: bytes.length, content: bytes.toString("base64"), encoding: "base64" });
    }
    const contentsMatch = path.match(/\/contents\/(.+)$/);
    if (method === "GET" && contentsMatch) {
      const filePath = decodeURIComponent(contentsMatch[1]);
      const main = state.commits.get(state.refs.get("heads/main") || "");
      const entry = main ? state.trees.get(main.tree)?.find((item) => item.path === filePath) : undefined;
      if (!entry) return json({ message: "missing file" }, 404);
      const bytes = state.blobs.get(entry.sha);
      if (!bytes) return json({ message: "missing blob" }, 404);
      return json({ size: bytes.length, content: bytes.toString("base64"), encoding: "base64" });
    }
    if (method === "POST" && path.endsWith("/git/blobs")) {
      const bytes = Buffer.from(String(body?.content || ""), String(body?.encoding || "base64"));
      return json({ sha: storeBlob(state, bytes) });
    }
    if (method === "POST" && path.endsWith("/git/trees")) {
      state.ids += 1;
      const sha = `tree-${state.ids}`;
      const base = body?.base_tree ? [...(state.trees.get(String(body.base_tree)) ?? [])] : [];
      const byPath = new Map(base.map((entry) => [entry.path, entry]));
      for (const entry of (body?.tree as { path: string; sha: string; type: string }[]) ?? []) byPath.set(entry.path, entry);
      state.trees.set(sha, [...byPath.values()]);
      return json({ sha });
    }
    if (method === "POST" && path.endsWith("/git/commits")) {
      state.ids += 1;
      const sha = `commit-${state.ids}`;
      state.commits.set(sha, {
        tree: String(body?.tree || ""),
        parents: (body?.parents as string[]) ?? [],
        message: String(body?.message || ""),
      });
      return json({ sha, tree: { sha: body?.tree } });
    }
    if (method === "PATCH" && path.endsWith("/git/refs/heads/main")) {
      assert.equal(JSON.stringify(body).includes("force"), false);
      if (state.failMainUpdates > 0) {
        state.failMainUpdates -= 1;
        return json({ message: "Update is not a fast forward" }, 422);
      }
      state.refs.set("heads/main", String(body?.sha || ""));
      return json({ ref: "refs/heads/main" });
    }
    if (method === "POST" && path.endsWith("/git/refs")) {
      const name = String(body?.ref || "").replace(/^refs\//, "");
      if (state.refs.has(name)) return json({ message: "Reference already exists" }, 422);
      assert.match(name, /^linkedin-claims\//);
      state.refs.set(name, String(body?.sha || ""));
      return json({ ref: body?.ref });
    }
    const patchClaim = path.match(/\/git\/refs\/(linkedin-claims\/[a-z0-9-]+)$/);
    if (method === "PATCH" && patchClaim) {
      assert.equal(JSON.stringify(body).includes("force"), false);
      state.refs.set(patchClaim[1], String(body?.sha || ""));
      return json({ ref: patchClaim[1] });
    }
    if (method === "DELETE" && patchClaim) {
      state.refs.delete(patchClaim[1]);
      return new Response(null, { status: 204 });
    }
    if (method === "POST" && path.endsWith("/dispatches")) {
      state.dispatches.push(body);
      return new Response(null, { status: 204 });
    }
    return json({ message: `unexpected ${method} ${path}` }, 404);
  };
}

describe("verified commits", () => {
  it("creates one signed commit from existing blobs and retries a moved branch", async () => {
    const state = mockState();
    const post = storeBlob(state, Buffer.from(markdown));
    const image = storeBlob(state, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    state.failMainUpdates = 1;
    const git = createVerifiedGit(token, mockFetch(state));
    const result = await git.commitPrepared({
      message: "Post: Hello",
      slug: "2026-10-21-hello",
      files: [
        { path: postPath, sha: post },
        { path: imagePath, sha: image },
      ],
    });
    assert.equal(result.created, true);
    assert.equal(state.refs.get("heads/main"), result.sha);
    const commit = state.commits.get(result.sha);
    assert.deepEqual(commit?.parents, ["commit-main"]);
    assert.equal(commit?.message, "Post: Hello");
    const paths = state.trees.get(commit?.tree || "")?.map((entry) => entry.path);
    assert.deepEqual(paths?.sort(), ["README.md", imagePath, postPath].sort());
  });

  it("does not create a second commit when the post is already on main", async () => {
    const state = mockState();
    const post = storeBlob(state, Buffer.from(markdown));
    const main = state.commits.get("commit-main");
    state.trees.set(main?.tree || "", [
      ...(state.trees.get(main?.tree || "") ?? []),
      { path: postPath, sha: post, type: "blob" },
    ]);
    const git = createVerifiedGit(token, mockFetch(state));
    const result = await git.commitPrepared({
      message: "Post: Hello",
      slug: "2026-10-21-hello",
      files: [{ path: postPath, sha: post }],
    });
    assert.equal(result.created, false);
    assert.equal(result.sha, "commit-main");
    assert.equal([...state.commits.keys()].some((sha) => sha !== "commit-main"), false);
  });

  it("records a LinkedIn id with a signed replacement and skips a repeat", async () => {
    const state = mockState();
    const original = storeBlob(state, Buffer.from(markdown));
    const main = state.commits.get("commit-main");
    state.trees.set(main?.tree || "", [
      ...(state.trees.get(main?.tree || "") ?? []),
      { path: postPath, sha: original, type: "blob" },
    ]);
    const git = createVerifiedGit(token, mockFetch(state));
    const next = markdown.replace("linkedinStatus: ready", 'linkedinStatus: "posted"\nlinkedinUrn: "urn:li:share:1"');
    const first = await git.replaceFile(postPath, Buffer.from(next), LINKEDIN_RECORD_MESSAGE);
    assert.equal(first.created, true);
    assert.equal(state.commits.get(first.sha)?.message, LINKEDIN_RECORD_MESSAGE);
    const second = await git.replaceFile(postPath, Buffer.from(next), LINKEDIN_RECORD_MESSAGE);
    assert.equal(second.created, false);
    await assert.rejects(
      () => git.replaceFile(postPath, Buffer.from("x"), "Post: Hello"),
      /Refusing this commit message/,
    );
  });

  it("claims a post outside main and can store the id for a retry", async () => {
    const state = mockState();
    const git = createVerifiedGit(token, mockFetch(state));
    const slug = "2026-10-21-hello";
    await git.createClaim(slug);
    assert.equal((await git.readClaim(slug))?.state, "posting");
    const claimCommit = state.commits.get(state.refs.get(`linkedin-claims/${slug}`) || "");
    assert.deepEqual(claimCommit?.parents, []);
    await assert.rejects(() => git.createClaim(slug), ClaimExistsError);
    await git.writeClaim(slug, { state: "posted", urn: "urn:li:share:1", url: "https://www.linkedin.com/feed/update/urn:li:share:1" });
    assert.equal((await git.readClaim(slug))?.state, "posted");
    const updated = state.commits.get(state.refs.get(`linkedin-claims/${slug}`) || "");
    assert.equal(updated?.parents.length, 1);
    assert.equal([...state.refs.keys()].some((ref) => ref.startsWith("heads/linkedin")), false);
    await git.deleteClaim(slug);
    assert.equal(await git.readClaim(slug), null);
    await git.deleteClaim(slug);
  });
});
