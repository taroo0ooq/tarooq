import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sealToken } from "./linkedin.ts";
import { createMemoryPostsDb } from "./memory-posts.ts";
import { clearLinkedInClaim, createOwnerPost, promoteDuePosts, retryLinkedIn, type ActionContext } from "./owner-actions.ts";
import type { PostDraft } from "./post-publish.ts";
import { isPublicPost } from "./post-view.ts";

const now = new Date("2026-10-21T09:00:00Z");
const origin = "https://alghazzi.org";

function png() {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

function draft(overrides: Partial<PostDraft> = {}): PostDraft {
  return {
    title: "Hello",
    description: "One sentence.",
    lang: "en",
    body: "First paragraph.",
    linkedinText: "First paragraph.",
    imageAlt: "A diagram",
    linkedin: false,
    image: { bytes: png(), ext: "png" },
    seoTitle: "Hello, precisely",
    seoDescription: "A tighter description.",
    intent: "publish",
    scheduledFor: null,
    removeCover: false,
    ...overrides,
  };
}

function context(fetchImpl?: typeof fetch): ActionContext {
  return { now, origin, supabaseUrl: "https://example.supabase.co", fetchImpl };
}

describe("owner posts", { concurrency: 1 }, () => {
  it("publishes to the site without a commit and keeps LinkedIn off", async () => {
    const db = createMemoryPostsDb();
    const changed: string[][] = [];
    const result = await createOwnerPost(db, draft(), { ...context(), onChange: (slugs) => changed.push(slugs) });
    assert.equal(result.post.status, "published");
    assert.equal(result.post.slug, "2026-10-21-hello");
    assert.equal(result.post.linkedinMode, "site");
    assert.equal(result.post.linkedinStatus, "hold");
    assert.equal(result.post.seoTitle, "Hello, precisely");
    assert.match(result.post.coverPath, /^covers\/2026-10-21-hello-/);
    assert.equal(result.url, "https://alghazzi.org/posts/2026-10-21-hello");
    assert.match(result.note, /within seconds/);
    assert.deepEqual(changed, [["2026-10-21-hello"]]);
    const stored = await db.readImage(result.post.coverPath);
    assert.equal(stored?.bytes.equals(png()), true);
  });

  it("hides a scheduled post until it is due, then publishes it once", async () => {
    const db = createMemoryPostsDb();
    const created = await createOwnerPost(db, draft({
      intent: "schedule",
      scheduledFor: "2026-10-21T12:30:00.000Z",
      image: null,
      imageAlt: "",
    }), context());
    assert.equal(created.post.status, "scheduled");
    const hidden = await db.getBySlug(created.post.slug);
    assert.equal(hidden ? isPublicPost(hidden, now) : true, false);
    assert.deepEqual(await promoteDuePosts(db, context()), []);
    const later = new Date("2026-10-21T13:00:00Z");
    assert.equal(hidden ? isPublicPost(hidden, later) : false, true);
    const promoted = await promoteDuePosts(db, { ...context(), now: later });
    assert.deepEqual(promoted, [created.post.slug]);
    const row = await db.getBySlug(created.post.slug);
    assert.equal(row?.status, "published");
    assert.deepEqual(await promoteDuePosts(db, { ...context(), now: later }), []);
  });

  it("posts to LinkedIn once and refuses a second send", async () => {
    const previousSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const previousPerson = process.env.LINKEDIN_PERSON_ID;
    process.env.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";
    process.env.LINKEDIN_PERSON_ID = "owner-person";
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.endsWith("/rest/posts")) {
        return new Response("", { status: 201, headers: { "x-restli-id": "urn:li:share:99" } });
      }
      return new Response("unexpected", { status: 500 });
    };
    try {
      const db = createMemoryPostsDb();
      await db.saveConnection({
        access_token: sealToken("access-token"),
        expires_at: "2026-12-01T00:00:00.000Z",
        person_id: "owner-person",
        person_urn: "urn:li:person:owner-person",
        name: "Tareq",
        email: "tareq@example.com",
      });
      const first = await createOwnerPost(db, draft({
        linkedin: true,
        image: null,
        imageAlt: "",
        linkedinText: "First paragraph.\n\nhttps://alghazzi.org/posts/2026-10-21-hello",
      }), context(fetchImpl));
      assert.equal(first.post.linkedinStatus, "posted");
      assert.equal(first.post.linkedinUrn, "urn:li:share:99");
      assert.equal(first.warning, "");
      const again = await retryLinkedIn(db, first.post.slug, context(fetchImpl));
      assert.equal(again.post.linkedinUrn, "urn:li:share:99");
      assert.match(again.note, /not sent again/);
      assert.equal(calls.filter((call) => call.includes("/rest/posts")).length, 1);
    } finally {
      if (previousSecret === undefined) delete process.env.LINKEDIN_CLIENT_SECRET;
      else process.env.LINKEDIN_CLIENT_SECRET = previousSecret;
      if (previousPerson === undefined) delete process.env.LINKEDIN_PERSON_ID;
      else process.env.LINKEDIN_PERSON_ID = previousPerson;
    }
  });

  it("releases the claim after a definite LinkedIn rejection and keeps it after a network failure", async () => {
    const previousSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const previousPerson = process.env.LINKEDIN_PERSON_ID;
    process.env.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";
    process.env.LINKEDIN_PERSON_ID = "owner-person";
    let status = 422;
    let posts = 0;
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/rest/posts")) {
        posts += 1;
        return new Response("no", { status });
      }
      throw new Error("offline");
    };
    try {
      const db = createMemoryPostsDb();
      await db.saveConnection({
        access_token: sealToken("access-token"),
        expires_at: "2026-12-01T00:00:00.000Z",
        person_id: "owner-person",
        person_urn: "urn:li:person:owner-person",
        name: "Tareq",
        email: "",
      });
      const input = draft({
        linkedin: true,
        image: null,
        imageAlt: "",
        linkedinText: "First paragraph.\n\nhttps://alghazzi.org/posts/2026-10-21-hello",
      });
      const rejected = await createOwnerPost(db, input, context(fetchImpl));
      assert.equal(rejected.post.status, "published");
      assert.equal(rejected.post.linkedinStatus, "failed");
      assert.match(rejected.warning, /422/);
      status = 201;
      const fetchOk: typeof fetch = async (input) => {
        posts += 1;
        assert.match(String(input), /\/rest\/posts$/);
        return new Response("", { status: 201, headers: { "x-restli-id": "urn:li:share:100" } });
      };
      const retried = await retryLinkedIn(db, rejected.post.slug, context(fetchOk));
      assert.equal(retried.post.linkedinUrn, "urn:li:share:100");

      const db2 = createMemoryPostsDb();
      await db2.saveConnection({
        access_token: sealToken("access-token"),
        expires_at: "2026-12-01T00:00:00.000Z",
        person_id: "owner-person",
        person_urn: "urn:li:person:owner-person",
        name: "Tareq",
        email: "",
      });
      const offline: typeof fetch = async () => {
        throw new Error("offline");
      };
      const ambiguous = await createOwnerPost(db2, draft({
        title: "Second",
        linkedin: true,
        image: null,
        imageAlt: "",
        linkedinText: "First paragraph.\n\nhttps://alghazzi.org/posts/2026-10-21-second",
      }), context(offline));
      assert.equal(ambiguous.post.linkedinStatus, "failed");
      const blocked = await retryLinkedIn(db2, ambiguous.post.slug, context(fetchOk));
      assert.match(blocked.warning, /not sent again/);
      assert.equal(blocked.post.linkedinUrn, "");
      const cleared = await clearLinkedInClaim(db2, ambiguous.post.slug, context());
      assert.equal(cleared.post.linkedinStatus, "hold");
      const sent = await retryLinkedIn(db2, ambiguous.post.slug, context(fetchOk));
      assert.equal(sent.post.linkedinUrn, "urn:li:share:100");
      assert.ok(posts >= 2);
    } finally {
      if (previousSecret === undefined) delete process.env.LINKEDIN_CLIENT_SECRET;
      else process.env.LINKEDIN_CLIENT_SECRET = previousSecret;
      if (previousPerson === undefined) delete process.env.LINKEDIN_PERSON_ID;
      else process.env.LINKEDIN_PERSON_ID = previousPerson;
    }
  });
});
