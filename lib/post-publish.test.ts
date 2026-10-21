import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PostInputError } from "./post-draft.ts";
import { draftFromFormData, draftFromJson } from "./post-publish.ts";
import { authorizePostsApi } from "./posts-http.ts";
import { redactSecrets } from "./secrets.ts";

function png() {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

describe("draft parsing", () => {
  it("reads the same fields from JSON and multipart", async () => {
    const fromJson = draftFromJson({
      title: 'ملاحظة: "السحابة"',
      description: "سطر واحد.",
      lang: "ar",
      body: "النص.",
      linkedinText: "النص.",
      imageAlt: "رسم",
      publish: "both",
      intent: "draft",
      seoTitle: "عنوان",
      image: { data: png().toString("base64"), filename: "رسم.png", contentType: "image/png" },
    });
    assert.equal(fromJson.lang, "ar");
    assert.equal(fromJson.linkedin, true);
    assert.equal(fromJson.intent, "draft");
    assert.equal(fromJson.seoTitle, "عنوان");
    assert.equal(fromJson.image?.ext, "png");
    assert.equal(fromJson.title, 'ملاحظة: "السحابة"');

    const form = new FormData();
    form.set("title", "A note from the desk");
    form.set("description", "One sentence on why the platform matters.");
    form.set("lang", "en");
    form.set("body", "The first paragraph.");
    form.set("linkedinText", "The first paragraph.");
    form.set("publish", "site");
    form.set("intent", "publish");
    form.set("imageAlt", "Optional description of the image");
    form.set("image", new File([png()], "diagram.png", { type: "image/png" }));
    const fromForm = await draftFromFormData(form);
    assert.equal(fromForm.linkedin, false);
    assert.equal(fromForm.intent, "publish");
    assert.equal(fromForm.image?.ext, "png");
    assert.equal(fromForm.imageAlt, "Optional description of the image");
  });

  it("treats a Riyadh datetime-local value as UTC+3", () => {
    const draft = draftFromJson({
      title: "Later",
      description: "One sentence.",
      lang: "en",
      body: "Hello.",
      publish: "site",
      intent: "schedule",
      scheduledFor: "2026-10-21T15:00",
    });
    assert.equal(draft.scheduledFor, "2026-10-21T12:00:00.000Z");
  });

  it("allows an empty body on a draft and requires one to publish", () => {
    const draft = draftFromJson({ title: "Sketch", lang: "en", publish: "site", intent: "draft" });
    assert.equal(draft.body, "");
    assert.throws(() => draftFromJson({ title: "Sketch", lang: "en", publish: "site", intent: "publish" }), PostInputError);
  });
});

describe("machine auth", () => {
  it("compares the bearer token without accepting a missing secret", () => {
    const previousToken = process.env.POSTS_API_TOKEN;
    const previousHook = process.env.VERCEL_DEPLOY_HOOK_URL;
    const previousSupabase = process.env.SUPABASE_SECRET_KEY;
    process.env.POSTS_API_TOKEN = "placeholder-token";
    process.env.VERCEL_DEPLOY_HOOK_URL = "https://api.vercel.com/v1/integrations/deploy/hook/example";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_placeholder";
    try {
      const ok = authorizePostsApi(new Request("https://alghazzi.org/api/posts", { headers: { authorization: "Bearer placeholder-token" } }));
      assert.equal(ok.ok, true);
      const denied = authorizePostsApi(new Request("https://alghazzi.org/api/posts", { headers: { authorization: "Bearer wrong" } }));
      assert.equal(denied.ok, false);
      if (!denied.ok) assert.equal(denied.status, 401);
      const empty = authorizePostsApi(new Request("https://alghazzi.org/api/posts"));
      assert.equal(empty.ok, false);
      const leaked = redactSecrets("failed with placeholder-token and https://api.vercel.com/v1/integrations/deploy/hook/example and sb_secret_placeholder");
      assert.equal(leaked.includes("placeholder-token"), false);
      assert.equal(leaked.includes("deploy/hook"), false);
      assert.equal(leaked.includes("sb_secret_placeholder"), false);
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
      if (previousSupabase === undefined) delete process.env.SUPABASE_SECRET_KEY;
      else process.env.SUPABASE_SECRET_KEY = previousSupabase;
    }
  });
});
