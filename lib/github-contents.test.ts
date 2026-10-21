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
  it("uploads blobs and dispatches a signed commit without moving main", async () => {
    const calls: Call[] = [];
    const markdown = Buffer.from("---\ntitle: \"Hello\"\nlinkedinStatus: hold\n---\n\nBody\n", "utf8");
    const image = Buffer.alloc(64 * 1024, 7);
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
      if (url.endsWith("/git/blobs") && method === "POST") return json({ sha: `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa${calls.length % 10}` });
      if (url.endsWith("/dispatches") && method === "POST") return new Response(null, { status: 204 });
      return json({ message: "unexpected" }, 404);
    };

    const client = createGitHubClient(token, fetchImpl);
    const listed = await client.listPostFiles();
    assert.deepEqual(listed, { mdx: ["old.mdx"], images: ["old.png"] });
    const result = await client.commit("Post: Hello", [
      { path: "content/posts/2026-10-20-hello.mdx", bytes: markdown },
      { path: "public/posts/hello.png", bytes: image },
    ]);
    assert.equal(result.queued, true);
    assert.equal(result.sha, "");

    const blobs = calls.filter((call) => call.url.endsWith("/git/blobs"));
    assert.equal(blobs.length, 2);
    assert.equal(blobs[0].body && (blobs[0].body as { content: string }).content, markdown.toString("base64"));
    assert.equal(blobs[1].body && (blobs[1].body as { content: string }).content, image.toString("base64"));
    const dispatch = calls.find((call) => call.method === "POST" && call.url.endsWith("/dispatches"));
    const payload = dispatch?.body as { event_type: string; client_payload: { slug: string; files: { sha: string }[] } };
    assert.equal(payload.event_type, "publish-post");
    assert.equal(payload.client_payload.slug, "2026-10-20-hello");
    assert.equal(payload.client_payload.files.length, 2);
    const serialized = JSON.stringify(dispatch?.body);
    assert.equal(serialized.includes(image.toString("base64").slice(0, 40)), false);
    assert.ok(serialized.length < 2000);
    assert.equal(calls.some((call) => call.method === "PATCH"), false);
    assert.equal(calls.some((call) => call.method === "POST" && call.url.endsWith("/git/commits")), false);
    assert.ok(calls.every((call) => call.authorization === `Bearer ${token}`));
  });

  it("redacts the token from GitHub errors and refuses unsafe or existing paths", async () => {
    const calls: Call[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      calls.push({ url, method: init?.method ?? "GET", body: null, authorization: "" });
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
    const callsAfterOverwrite = calls.length;
    await assert.rejects(
      () => client.commit("Post: Hello", [{ path: "../secrets.txt", bytes: Buffer.from("x") }]),
      PostInputError,
    );
    assert.equal(calls.length, callsAfterOverwrite);
    await assert.rejects(
      () => client.commit("chore: record LinkedIn post ids [linkedin]", [{ path: "content/posts/2026-10-20-hello-2.mdx", bytes: Buffer.from("x") }]),
      /Refusing this commit message/,
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
