import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryPostsDb } from "./memory-posts.ts";
import type { PostInsert } from "./post-types.ts";
import { readPublishedPosts } from "./post-source.ts";
import type { PostMeta } from "./posts.ts";

const now = new Date("2026-10-21T12:00:00Z");

function row(overrides: Partial<PostInsert> = {}): PostInsert {
  return {
    slug: "2026-10-21-note",
    title: "Note",
    description: "One sentence.",
    body: "Hello.",
    lang: "en",
    status: "published",
    published_on: "2026-10-21",
    published_at: "2026-10-21T09:00:00.000Z",
    scheduled_for: null,
    cover_path: "/posts/note.png",
    cover_alt: "A diagram",
    seo_title: "",
    seo_description: "",
    linkedin_text: "",
    linkedin_mode: "site",
    linkedin_status: "hold",
    linkedin_urn: "",
    linkedin_url: "",
    linkedin_error: "",
    link_placement: "comment",
    first_comment: "",
    doc_path: "",
    doc_title: "",
    ...overrides,
  };
}

function files(): PostMeta[] {
  return [{
    slug: "bundled",
    title: "Bundled",
    date: "2026-10-01",
    description: "",
    lang: "",
    image: "",
    imageAlt: "",
    linkedinText: "",
    linkedinStatus: "hold",
    linkedinUrn: "",
    linkedinUrl: "",
    html: "<p>Bundled</p>",
    seoTitle: "",
    seoDescription: "",
  }];
}

describe("published posts", () => {
  it("falls back to the bundled files when Supabase has no rows", async () => {
    const db = createMemoryPostsDb();
    const result = await readPublishedPosts({
      hasAny: () => db.hasAny(),
      list: () => db.list(),
      files,
      now,
      supabaseUrl: "https://example.supabase.co",
    });
    assert.equal(result.source, "files");
    assert.equal(result.posts[0]?.slug, "bundled");
  });

  it("falls back when Supabase cannot be reached", async () => {
    const result = await readPublishedPosts({
      hasAny: async () => { throw new Error("offline"); },
      list: async () => [],
      files,
      now,
      supabaseUrl: "https://example.supabase.co",
    });
    assert.equal(result.source, "files");
  });

  it("uses Supabase once any row exists and hides drafts and future posts", async () => {
    const db = createMemoryPostsDb();
    await db.insert(row());
    await db.insert(row({ slug: "2026-10-21-draft", title: "Draft", status: "draft", published_at: null }));
    await db.insert(row({
      slug: "2026-10-22-later",
      title: "Later",
      status: "scheduled",
      published_on: "2026-10-22",
      scheduled_for: "2026-10-22T12:00:00.000Z",
      cover_path: "covers/later.png",
    }));
    await db.insert(row({
      slug: "2026-10-21-due",
      title: "Due",
      status: "scheduled",
      scheduled_for: "2026-10-21T11:00:00.000Z",
      seo_title: "SEO title",
    }));
    const result = await readPublishedPosts({
      hasAny: () => db.hasAny(),
      list: () => db.list(),
      files,
      now,
      supabaseUrl: "https://example.supabase.co",
    });
    assert.equal(result.source, "supabase");
    assert.deepEqual(result.posts.map((post) => post.slug), ["2026-10-21-note", "2026-10-21-due"]);
    assert.equal(result.posts.some((post) => post.slug === "2026-10-21-draft"), false);
    assert.equal(result.posts.some((post) => post.slug === "bundled"), false);
    const due = result.posts.find((post) => post.slug === "2026-10-21-due");
    assert.equal(due?.seoTitle, "SEO title");
    const later = result.posts.find((post) => post.slug === "2026-10-22-later");
    assert.equal(later, undefined);
    const note = result.posts.find((post) => post.slug === "2026-10-21-note");
    assert.equal(note?.image, "/posts/note.png");
  });
});
