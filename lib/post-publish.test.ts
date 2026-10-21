import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GitHubClient } from "./github-contents.ts";
import { parseFrontmatter } from "./posts.ts";
import { PostInputError } from "./post-draft.ts";
import { draftFromFormData, draftFromJson, publishDraft, type PostDraft } from "./post-publish.ts";
import { authorizePostsApi } from "./posts-http.ts";
import { redactSecrets } from "./secrets.ts";

const now = new Date("2026-10-20T12:00:00Z");
const origin = "https://alghazzi.org";

function png() {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

function draft(overrides: Partial<PostDraft> = {}): PostDraft {
  return {
    title: "Hello",
    description: "One sentence.",
    lang: "en",
    body: "First paragraph.\n\nSecond paragraph.",
    linkedinText: "First paragraph.\n\nhttps://alghazzi.org/posts/2026-10-20-hello",
    imageAlt: "A diagram",
    linkedin: false,
    image: { bytes: png(), ext: "png" },
    ...overrides,
  };
}

describe("publish", () => {
  it("commits a new slug when the first one is taken and keeps LinkedIn on hold", async () => {
    const committed: { message: string; files: { path: string; bytes: Buffer }[] }[] = [];
    const client: GitHubClient = {
      async listPostFiles() {
        return { mdx: ["2026-10-20-hello.mdx"], images: ["hello.png"] };
      },
      async commit(message, files) {
        committed.push({ message, files });
        return { sha: "abc123def" };
      },
    };
    const result = await publishDraft(draft(), { client, now, origin });
    assert.equal(result.slug, "2026-10-20-hello-2");
    assert.equal(result.url, "https://alghazzi.org/posts/2026-10-20-hello-2");
    assert.equal(result.commitUrl, "https://github.com/taroo0ooq/tarooq/commit/abc123def");
    assert.equal(result.linkedinStatus, "hold");
    assert.equal(result.queued, false);
    assert.match(result.note, /verified commit on main/);
    assert.match(result.note, /after the Vercel deploy/);
    assert.equal(committed.length, 1);
    assert.equal(committed[0].message, "Post: Hello");
    assert.deepEqual(
      committed[0].files.map((file) => file.path),
      ["content/posts/2026-10-20-hello-2.mdx", "public/posts/hello-2.png"],
    );
    const markdown = committed[0].files[0].bytes.toString("utf8");
    const { data, body } = parseFrontmatter(markdown);
    assert.equal(data.linkedinStatus, "hold");
    assert.equal(data.image, "/posts/hello-2.png");
    assert.equal(data.linkedinText, "First paragraph.\n\nhttps://alghazzi.org/posts/2026-10-20-hello-2");
    assert.match(body, /Second paragraph/);
    assert.equal(committed[0].files[1].bytes.equals(png()), true);
  });

  it("retries once when the branch moved and marks LinkedIn ready", async () => {
    let attempts = 0;
    const client: GitHubClient = {
      async listPostFiles() {
        return { mdx: [], images: [] };
      },
      async commit() {
        attempts += 1;
        if (attempts === 1) throw new Error("Refusing to overwrite content/posts/2026-10-20-hello.mdx.");
        return { sha: "retry-sha" };
      },
    };
    const result = await publishDraft(draft({ linkedin: true, image: null, imageAlt: "" }), { client, now, origin });
    assert.equal(attempts, 2);
    assert.equal(result.linkedinStatus, "ready");
    assert.equal(result.commitUrl, "https://github.com/taroo0ooq/tarooq/commit/retry-sha");
  });

  it("points at the workflow when the commit is queued for signing", async () => {
    const client: GitHubClient = {
      async listPostFiles() {
        return { mdx: [], images: [] };
      },
      async commit() {
        return { sha: "", queued: true };
      },
    };
    const result = await publishDraft(draft({ image: null, imageAlt: "" }), { client, now, origin });
    assert.equal(result.queued, true);
    assert.equal(result.commitUrl, "https://github.com/taroo0ooq/tarooq/actions/workflows/publish-linkedin.yml");
    assert.equal(result.slug, "2026-10-20-hello");
  });

  it("does not retry a rejected draft", async () => {
    let attempts = 0;
    const client: GitHubClient = {
      async listPostFiles() {
        attempts += 1;
        return { mdx: [], images: [] };
      },
      async commit() {
        throw new PostInputError("Refusing to write outside the posts directories.");
      },
    };
    await assert.rejects(() => publishDraft(draft({ image: null, imageAlt: "" }), { client, now, origin }), PostInputError);
    assert.equal(attempts, 1);
  });

  it("reads the same fields from JSON and multipart", async () => {
    const fromJson = draftFromJson({
      title: 'ملاحظة: "السحابة"',
      description: "سطر واحد.",
      lang: "ar",
      body: "النص.",
      linkedinText: "النص.",
      imageAlt: "رسم",
      publish: "both",
      image: { data: png().toString("base64"), filename: "رسم.png", contentType: "image/png" },
    });
    assert.equal(fromJson.lang, "ar");
    assert.equal(fromJson.linkedin, true);
    assert.equal(fromJson.image?.ext, "png");
    assert.equal(fromJson.title, 'ملاحظة: "السحابة"');

    const form = new FormData();
    form.set("title", "A note from the desk");
    form.set("description", "One sentence on why the platform matters.");
    form.set("lang", "en");
    form.set("body", "The first paragraph.");
    form.set("linkedinText", "The first paragraph.");
    form.set("publish", "site");
    form.set("imageAlt", "Optional description of the image");
    form.set("image", new File([png()], "diagram.png", { type: "image/png" }));
    const fromForm = await draftFromFormData(form);
    assert.equal(fromForm.linkedin, false);
    assert.equal(fromForm.image?.ext, "png");
    assert.equal(fromForm.imageAlt, "Optional description of the image");
  });
});

describe("machine auth", () => {
  it("compares the bearer token without accepting a missing secret", () => {
    const previousToken = process.env.POSTS_API_TOKEN;
    const previousHook = process.env.VERCEL_DEPLOY_HOOK_URL;
    process.env.POSTS_API_TOKEN = "placeholder-token";
    process.env.VERCEL_DEPLOY_HOOK_URL = "https://api.vercel.com/v1/integrations/deploy/hook/example";
    try {
      const ok = authorizePostsApi(new Request("https://alghazzi.org/api/posts", { headers: { authorization: "Bearer placeholder-token" } }));
      assert.equal(ok.ok, true);
      const denied = authorizePostsApi(new Request("https://alghazzi.org/api/posts", { headers: { authorization: "Bearer wrong" } }));
      assert.equal(denied.ok, false);
      if (!denied.ok) assert.equal(denied.status, 401);
      const empty = authorizePostsApi(new Request("https://alghazzi.org/api/posts"));
      assert.equal(empty.ok, false);
      const leaked = redactSecrets("failed with placeholder-token and https://api.vercel.com/v1/integrations/deploy/hook/example");
      assert.equal(leaked.includes("placeholder-token"), false);
      assert.equal(leaked.includes("deploy/hook"), false);
      assert.match(leaked, /\[redacted\]/);
      delete process.env.POSTS_API_TOKEN;
      const unset = authorizePostsApi(new Request("https://alghazzi.org/api/posts", { headers: { authorization: "Bearer placeholder-token" } }));
      assert.equal(unset.ok, false);
      if (!unset.ok) assert.equal(unset.status, 503);
    } finally {
      if (previousToken === undefined) delete process.env.POSTS_API_TOKEN;
      else process.env.POSTS_API_TOKEN = previousToken;
      if (previousHook === undefined) delete process.env.VERCEL_DEPLOY_HOOK_URL;
      else process.env.VERCEL_DEPLOY_HOOK_URL = previousHook;
    }
  });
});
