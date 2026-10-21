import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { DOCUMENT_RETRY_WAITS_MS, publishToLinkedIn } from "./linkedin-publish.ts";
import { sealToken } from "./linkedin.ts";
import { createMemoryPostsDb } from "./memory-posts.ts";
import { clearLinkedInClaim, createOwnerPost, deleteOwnerPost, promoteDuePosts, retryLinkedIn, updateOwnerPost, type ActionContext } from "./owner-actions.ts";
import { PostInputError } from "./post-draft.ts";
import { draftFromJson } from "./post-publish.ts";
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
    linkPlacement: "comment",
    firstComment: "",
    document: null,
    documentPath: "",
    documentTitle: "",
    removeDocument: false,
    siteCover: null,
    ...overrides,
  };
}

function pdfBytes() {
  return Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
}

function documentPath(seed = "ab") {
  return `documents/${seed.repeat(16)}.pdf`;
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

  it("publishes an Arabic post at the Arabic URL", async () => {
    const db = createMemoryPostsDb();
    const result = await createOwnerPost(db, draft({
      lang: "ar",
      title: "مرحبا",
      linkedinText: "ملاحظة.\n\nhttps://alghazzi.org/posts/2026-10-21-post",
      linkPlacement: "text",
    }), context());
    assert.equal(result.url, `https://alghazzi.org/ar/posts/${result.post.slug}`);
    assert.equal(result.post.lang, "ar");
    assert.match(result.post.linkedinText, new RegExp(`/ar/posts/${result.post.slug}$`));
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

  it("keeps the article URL out of the LinkedIn text and offers it as the first comment", async () => {
    const db = createMemoryPostsDb();
    const created = await createOwnerPost(db, draft({
      linkedin: false,
      image: null,
      imageAlt: "",
      linkedinText: "First paragraph.",
      linkPlacement: "comment",
    }), context());
    assert.equal(created.post.linkedinText, "First paragraph.");
    assert.equal(created.post.linkPlacement, "comment");
    assert.equal(created.post.firstComment, "https://alghazzi.org/posts/2026-10-21-hello");
    const custom = await updateOwnerPost(db, created.post.slug, draft({
      linkedin: false,
      image: null,
      imageAlt: "",
      linkedinText: "Edited paragraph.",
      linkPlacement: "comment",
      firstComment: "Read it here, then the link.",
    }), context());
    assert.equal(custom.post.linkedinText, "Edited paragraph.");
    assert.equal(custom.post.firstComment, "Read it here, then the link.");
  });

  it("still appends the URL and sends an article when the link stays in the text", async () => {
    const previousSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const previousPerson = process.env.LINKEDIN_PERSON_ID;
    process.env.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";
    process.env.LINKEDIN_PERSON_ID = "owner-person";
    let body: Record<string, unknown> | null = null;
    const fetchImpl: typeof fetch = async (input, init) => {
      assert.match(String(input), /\/rest\/posts$/);
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response("", { status: 201, headers: { "x-restli-id": "urn:li:share:41" } });
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
      const created = await createOwnerPost(db, draft({
        linkedin: true,
        image: null,
        imageAlt: "",
        linkedinText: "First paragraph.",
        linkPlacement: "text",
      }), context(fetchImpl));
      assert.equal(created.post.linkedinText, "First paragraph.\n\nhttps://alghazzi.org/posts/2026-10-21-hello");
      assert.equal(created.post.firstComment, "");
      assert.equal(created.post.linkedinUrl, "https://www.linkedin.com/feed/update/urn:li:share:41");
      const content = body?.content as { article?: { source?: string } };
      assert.equal(content.article?.source, "https://alghazzi.org/posts/2026-10-21-hello");
      assert.equal(body?.commentary, created.post.linkedinText);
    } finally {
      if (previousSecret === undefined) delete process.env.LINKEDIN_CLIENT_SECRET;
      else process.env.LINKEDIN_CLIENT_SECRET = previousSecret;
      if (previousPerson === undefined) delete process.env.LINKEDIN_PERSON_ID;
      else process.env.LINKEDIN_PERSON_ID = previousPerson;
    }
  });

  it("publishes a PDF, retries while LinkedIn is still processing, and keeps the cover on the site", async () => {
    const previousSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const previousPerson = process.env.LINKEDIN_PERSON_ID;
    process.env.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";
    process.env.LINKEDIN_PERSON_ID = "owner-person";
    const sleeps: number[] = [];
    const calls: string[] = [];
    let posts = 0;
    let postBody: Record<string, unknown> | null = null;
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.includes("/rest/documents?action=initializeUpload")) {
        const request = JSON.parse(String(init?.body)) as { initializeUploadRequest?: { owner?: string } };
        assert.equal(request.initializeUploadRequest?.owner, "urn:li:person:owner-person");
        return Response.json({
          value: {
            uploadUrl: "https://www.linkedin.com/dms-uploads/document.pdf",
            document: "urn:li:document:C5F10AQ",
          },
        });
      }
      if (url.startsWith("https://www.linkedin.com/dms-uploads/")) {
        assert.equal(init?.method, "PUT");
        return new Response(null, { status: 201 });
      }
      if (url.endsWith("/rest/posts")) {
        posts += 1;
        if (posts < 3) return Response.json({ message: "The document is still processing. Please try again." }, { status: 422 });
        postBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return new Response(null, { status: 201, headers: { "x-restli-id": "urn:li:share:77" } });
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
        email: "",
      });
      const path = documentPath();
      await db.uploadDocument(path, pdfBytes());
      const created = await createOwnerPost(db, draft({
        linkedin: true,
        image: null,
        siteCover: { bytes: png(), ext: "png" },
        imageAlt: "A diagram",
        linkedinText: "The paper, without the site link.",
        linkPlacement: "comment",
        firstComment: "",
        documentPath: path,
        documentTitle: "The paper",
      }), { ...context(fetchImpl), sleep: async (ms) => { sleeps.push(ms); } });
      assert.equal(created.post.linkedinStatus, "posted");
      assert.equal(created.post.linkedinUrn, "urn:li:share:77");
      assert.equal(created.post.linkedinUrl, "https://www.linkedin.com/feed/update/urn:li:share:77");
      assert.equal(created.post.docPath, path);
      assert.equal(created.post.docTitle, "The paper");
      assert.equal(created.post.linkedinText, "The paper, without the site link.");
      assert.equal(created.post.firstComment, `https://alghazzi.org/posts/${created.post.slug}`);
      assert.match(created.post.coverPath, /^covers\//);
      assert.equal(calls.some((call) => call.includes("/rest/images")), false);
      assert.equal(posts, 3);
      assert.deepEqual(sleeps, DOCUMENT_RETRY_WAITS_MS.slice(0, 2));
      const content = postBody?.content as { media?: { id?: string; title?: string }; article?: unknown };
      assert.equal(content.media?.id, "urn:li:document:C5F10AQ");
      assert.equal(content.media?.title, "The paper");
      assert.equal(content.article, undefined);
      assert.equal(String(postBody?.commentary).includes("alghazzi.org"), false);
    } finally {
      if (previousSecret === undefined) delete process.env.LINKEDIN_CLIENT_SECRET;
      else process.env.LINKEDIN_CLIENT_SECRET = previousSecret;
      if (previousPerson === undefined) delete process.env.LINKEDIN_PERSON_ID;
      else process.env.LINKEDIN_PERSON_ID = previousPerson;
    }
  });

  it("rejects an image and a PDF together, a missing title, a bad path, and a file that is not a PDF", async () => {
    const pngData = png().toString("base64");
    assert.throws(() => draftFromJson({
      title: "Both",
      description: "One sentence.",
      lang: "en",
      body: "Hello.",
      publish: "both",
      imageAlt: "A diagram",
      image: { data: pngData, filename: "diagram.png", contentType: "image/png" },
      documentPath: documentPath(),
      documentTitle: "The paper",
    }), /image or a PDF/);
    assert.throws(() => draftFromJson({
      title: "Untitled file",
      description: "One sentence.",
      lang: "en",
      body: "Hello.",
      publish: "site",
      document: { data: pdfBytes().toString("base64") },
    }), /Document title is required/);
    assert.throws(() => draftFromJson({
      title: "Bad path",
      description: "One sentence.",
      lang: "en",
      body: "Hello.",
      publish: "site",
      documentPath: "covers/secret.pdf",
      documentTitle: "The paper",
    }), /Document path is invalid/);
    assert.throws(() => draftFromJson({
      title: "Placement",
      lang: "en",
      body: "Hello.",
      publish: "site",
      intent: "draft",
      linkPlacement: "caption",
    }), /linkPlacement/);

    const db = createMemoryPostsDb();
    const badPath = documentPath("cd");
    await db.uploadDocument(badPath, Buffer.from("not a pdf"));
    await assert.rejects(() => createOwnerPost(db, draft({
      image: null,
      imageAlt: "",
      documentPath: badPath,
      documentTitle: "The paper",
    }), context()), (error: unknown) => error instanceof PostInputError && /not a PDF/.test(error.message));

    await assert.rejects(() => publishToLinkedIn({
      accessToken: "token",
      version: "202609",
      authorUrn: "urn:li:person:owner-person",
      commentary: "Hello",
      title: "Hello",
      description: "One sentence.",
      source: "https://alghazzi.org/posts/2026-10-21-hello",
      image: { bytes: png(), contentType: "image/png", alt: "A diagram" },
      document: { bytes: pdfBytes(), title: "The paper" },
      fetchImpl: async () => {
        throw new Error("LinkedIn should not be called");
      },
    }), /image or a PDF/);

    const calls: string[] = [];
    await assert.rejects(() => publishToLinkedIn({
      accessToken: "token",
      version: "202609",
      authorUrn: "urn:li:person:owner-person",
      commentary: "Hello without the link",
      title: "Hello",
      description: "One sentence.",
      source: "https://alghazzi.org/posts/2026-10-21-hello",
      image: { bytes: png(), contentType: "image/png", alt: "A diagram" },
      linkPlacement: "text",
      fetchImpl: async (input) => {
        calls.push(String(input));
        return new Response("no", { status: 500 });
      },
    }), /must include/);
    assert.equal(calls.length, 0);

    let deleted = false;
    const stored = documentPath("ef");
    await db.uploadDocument(stored, pdfBytes());
    const saved = await createOwnerPost(db, draft({
      image: null,
      imageAlt: "",
      linkedin: false,
      documentPath: stored,
      documentTitle: "Kept",
    }), context());
    const originalDelete = db.deleteDocument.bind(db);
    db.deleteDocument = async (objectPath) => {
      deleted = objectPath === stored;
      await originalDelete(objectPath);
    };
    await deleteOwnerPost(db, saved.post.slug, context());
    assert.equal(deleted, true);
    assert.equal(await db.readDocument(stored), null);
  });
});

describe("LinkedIn post body", () => {
  it("omits the article when the link is a comment, including on an image post", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes("/rest/images?action=initializeUpload")) {
        return Response.json({ value: { uploadUrl: "https://www.linkedin.com/dms-uploads/a.png", image: "urn:li:image:1" } });
      }
      if (url.startsWith("https://www.linkedin.com/dms-uploads/")) return new Response(null, { status: 201 });
      if (url.endsWith("/rest/posts")) {
        bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
        return new Response(null, { status: 201, headers: { "x-restli-id": "urn:li:share:8" } });
      }
      return new Response("unexpected", { status: 500 });
    };
    const base = {
      accessToken: "token",
      version: "202609",
      authorUrn: "urn:li:person:owner-person",
      commentary: "No link in the text.",
      title: "Hello",
      description: "One sentence.",
      source: "https://alghazzi.org/posts/2026-10-21-hello",
      linkPlacement: "comment" as const,
      fetchImpl,
    };
    await publishToLinkedIn({ ...base, image: null });
    assert.equal("content" in bodies[0], false);
    await publishToLinkedIn({
      ...base,
      image: { bytes: png(), contentType: "image/png", alt: "A diagram" },
    });
    const content = bodies[1]?.content as { media?: { id?: string }; article?: unknown };
    assert.equal(content.media?.id, "urn:li:image:1");
    assert.equal(content.article, undefined);
    assert.equal(String(bodies[1]?.commentary).includes("alghazzi.org"), false);

    await assert.rejects(() => publishToLinkedIn({
      ...base,
      image: null,
      document: { bytes: pdfBytes(), title: "The paper" },
      fetchImpl: async () => Response.json({
        value: { uploadUrl: "https://evil.example/upload", document: "urn:li:document:1" },
      }),
    }), /unexpected upload URL/);
  });
});

describe("document migration", () => {
  it("adds the comment fields and a private PDF bucket without applying them here", () => {
    const sql = readFileSync("supabase/migrations/20261021180000_posts_linkedin_documents.sql", "utf8");
    assert.match(sql, /link_placement text not null default 'comment'/);
    assert.match(sql, /link_placement in \('text', 'comment'\)/);
    assert.match(sql, /first_comment text not null default ''/);
    assert.match(sql, /doc_path text not null default ''/);
    assert.match(sql, /doc_title text not null default ''/);
    assert.match(sql, /char_length\(doc_title\) <= 140/);
    assert.match(sql, /set link_placement = 'text'/);
    assert.match(sql, /linkedin_status = 'posted'/);
    assert.match(sql, /'post-documents'/);
    assert.match(sql, /false/);
    assert.match(sql, /104857600/);
    assert.match(sql, /application\/pdf/);
    assert.equal(sql.includes("create policy"), false);
  });
});
