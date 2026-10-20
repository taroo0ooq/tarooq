import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createGitHubClient } from "./github-contents.ts";
import { PostInputError } from "./post-draft.ts";

const token = "github-contents-token-value";

type Call = { url: string; method: string; body: unknown; authorization: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("github contents", () => {
  it("commits the post and image in one update and does not force the ref", async () => {
    const calls: Call[] = [];
    const markdown = Buffer.from("---\ntitle: \"Hello\"\n---\n\nBody\n", "utf8");
    const image = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      const authorization = new Headers(init?.headers).get("authorization") ?? "";
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
      calls.push({ url, method, body, authorization });
      if (url.endsWith("/git/ref/heads/main")) return json({ object: { sha: "mainsha" } });
      if (url.endsWith("/git/commits/mainsha")) return json({ tree: { sha: "treesha" } });
      if (url.includes("/git/trees/treesha")) {
        return json({
          truncated: false,
          tree: [
            { path: "content/posts/old.mdx", type: "blob" },
            { path: "public/posts/old.png", type: "blob" },
          ],
        });
      }
      if (url.endsWith("/git/blobs") && method === "POST") return json({ sha: `blob-${calls.length}` });
      if (url.endsWith("/git/trees") && method === "POST") return json({ sha: "newtree" });
      if (url.endsWith("/git/commits") && method === "POST") return json({ sha: "newcommit" });
      if (url.endsWith("/git/refs/heads/main") && method === "PATCH") return json({ ref: "refs/heads/main" });
      return json({ message: "unexpected" }, 404);
    };

    const client = createGitHubClient(token, fetchImpl);
    const listed = await client.listPostFiles();
    assert.deepEqual(listed, { mdx: ["old.mdx"], images: ["old.png"] });
    const result = await client.commit("Post: Hello", [
      { path: "content/posts/2026-10-20-hello.mdx", bytes: markdown },
      { path: "public/posts/hello.png", bytes: image },
    ]);
    assert.equal(result.sha, "newcommit");

    const blobs = calls.filter((call) => call.url.endsWith("/git/blobs"));
    assert.equal(blobs.length, 2);
    assert.equal(blobs[0].body && (blobs[0].body as { content: string }).content, markdown.toString("base64"));
    assert.equal(blobs[1].body && (blobs[1].body as { content: string }).content, image.toString("base64"));
    const tree = calls.find((call) => call.method === "POST" && call.url.endsWith("/git/trees"));
    assert.equal((tree?.body as { base_tree: string }).base_tree, "treesha");
    const commit = calls.find((call) => call.method === "POST" && call.url.endsWith("/git/commits"));
    assert.deepEqual((commit?.body as { parents: string[] }).parents, ["mainsha"]);
    const patch = calls.find((call) => call.method === "PATCH");
    assert.deepEqual(patch?.body, { sha: "newcommit" });
    assert.equal(JSON.stringify(patch?.body).includes("force"), false);
    assert.ok(calls.every((call) => call.authorization === `Bearer ${token}`));
  });

  it("redacts the token from GitHub errors and refuses unsafe or existing paths", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/git/ref/heads/main")) return json({ object: { sha: "mainsha" } });
      if (url.endsWith("/git/commits/mainsha")) return json({ tree: { sha: "treesha" } });
      if (url.includes("/git/trees/treesha")) {
        return json({ truncated: false, tree: [{ path: "content/posts/2026-10-20-hello.mdx", type: "blob" }] });
      }
      return json({ message: `denied ${token}` }, 403);
    };
    const client = createGitHubClient(token, fetchImpl);
    await assert.rejects(
      () => client.commit("Post: Hello", [{ path: "content/posts/2026-10-20-hello.mdx", bytes: Buffer.from("x") }]),
      /Refusing to overwrite/,
    );
    await assert.rejects(
      () => client.commit("Post: Hello", [{ path: "../secrets.txt", bytes: Buffer.from("x") }]),
      PostInputError,
    );

    const failing: typeof fetch = async () => json({ message: `token=${token}` }, 500);
    const broken = createGitHubClient(token, failing);
    await assert.rejects(() => broken.listPostFiles(), (error: Error) => {
      assert.match(error.message, /\[redacted\]/);
      assert.equal(error.message.includes(token), false);
      return true;
    });
  });
});
