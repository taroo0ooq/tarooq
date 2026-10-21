import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  DRAFT_KEY_MIGRATION,
  DraftKeyColumnError,
  DailyDraftExistsError,
  SlugConflictError,
  assertDailyDraftSecrets,
  buildDailyDraftInsert,
  createDailyDraftClient,
  dailyDraftKey,
  formatDailyDraftFailure,
  messageText,
  missingDailyDraftConfig,
  missingDailyDraftMessage,
  normalizeGeneratedDraft,
  parseModelJson,
  saveDailyDraft,
  type DailyDraftClient,
  type DailyDraftHit,
  type DailyDraftInput,
  type DailyDraftRow,
} from "./daily-draft.ts";

const date = "2026-10-21";
const article = (count = 80) => Array.from({ length: count }, (_, index) => `word${index}`).join(" ");

function input(overrides: Partial<DailyDraftInput> = {}): DailyDraftInput {
  const preferredSlug = overrides.preferredSlug ?? "hello";
  return {
    date,
    title: "Hello",
    description: "One sentence about the work.",
    body: article(),
    linkedinText: `A note.\n\nhttps://alghazzi.org/posts/${date}-${preferredSlug}`,
    preferredSlug,
    existingSlugs: [],
    articleUrl: (fullSlug) => `https://alghazzi.org/posts/${fullSlug}`,
    ...overrides,
  };
}

function hit(overrides: Partial<DailyDraftHit> = {}): DailyDraftHit {
  return {
    slug: `${date}-hello`,
    status: "draft",
    linkedin_status: "hold",
    linkedin_mode: "site",
    published_at: null,
    scheduled_for: null,
    linkedin_urn: "",
    linkedin_url: "",
    ...overrides,
  };
}

function modelDraft(overrides: Record<string, unknown> = {}) {
  return {
    title: "A finished note",
    slug: "finished-note",
    description: "One sentence about the platform.",
    linkedinText: "The commentary.",
    bodyMarkdown: article(),
    ...overrides,
  };
}

describe("daily draft config", () => {
  it("names every missing secret and accepts either model key", () => {
    assert.deepEqual(missingDailyDraftConfig({}), ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "XAI_API_KEY or AI_GATEWAY_API_KEY"]);
    assert.match(missingDailyDraftMessage(missingDailyDraftConfig({})), /SUPABASE_URL/);
    assert.match(missingDailyDraftMessage(missingDailyDraftConfig({})), /SUPABASE_SECRET_KEY/);
    assert.match(missingDailyDraftMessage(missingDailyDraftConfig({})), /XAI_API_KEY or AI_GATEWAY_API_KEY/);
    assert.match(missingDailyDraftMessage(["SUPABASE_URL"]), /Missing GitHub Actions secret: SUPABASE_URL/);
    assert.deepEqual(missingDailyDraftConfig({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEY: "sb_secret_test",
      AI_GATEWAY_API_KEY: "gateway",
    }), []);
    assert.deepEqual(missingDailyDraftConfig({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEY: "sb_secret_test",
      XAI_API_KEY: "xai",
    }), []);
  });

  it("rejects a publishable key and a non-https project URL", () => {
    assert.throws(() => assertDailyDraftSecrets({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEY: "sb_publishable_test",
    }), /server secret key/);
    assert.throws(() => assertDailyDraftSecrets({
      SUPABASE_URL: "http://example.supabase.co",
      SUPABASE_SECRET_KEY: "sb_secret_test",
    }), /https/);
    const ok = assertDailyDraftSecrets({
      SUPABASE_URL: "https://example.supabase.co/rest/v1/",
      SUPABASE_SECRET_KEY: " sb_secret_test ",
    });
    assert.equal(ok.url, "https://example.supabase.co");
    assert.equal(ok.key, "sb_secret_test");
  });

  it("redacts secrets from a failure", () => {
    const message = formatDailyDraftFailure(new Error("failed with sb_secret_test and xai-key"), ["sb_secret_test", "xai-key"]);
    assert.equal(message.includes("sb_secret_test"), false);
    assert.equal(message.includes("xai-key"), false);
    assert.match(message, /\[redacted\]/);
  });
});

describe("daily draft generation", () => {
  it("parses fenced model JSON and keeps the article URL", () => {
    const text = messageText({
      choices: [{ message: { content: [{ text: "```json\n" }, { text: JSON.stringify(modelDraft()) }, "\n```"] } }],
    });
    const draft = normalizeGeneratedDraft(parseModelJson(text), {
      date,
      articleUrl: (fullSlug) => `https://alghazzi.org/posts/${fullSlug}`,
    });
    assert.equal(draft.preferredSlug, "finished-note");
    assert.equal(draft.linkedinText.includes(`https://alghazzi.org/posts/${date}-finished-note`), true);
    assert.equal(draft.body.split(/\s+/).length, 80);
  });

  it("strips a date prefix and rejects a short article or a bad slug", () => {
    const draft = normalizeGeneratedDraft(modelDraft({ slug: `${date}-Already-Used` }), {
      date,
      articleUrl: (fullSlug) => `https://alghazzi.org/posts/${fullSlug}`,
    });
    assert.equal(draft.preferredSlug, "already-used");
    assert.throws(() => normalizeGeneratedDraft(modelDraft({ bodyMarkdown: "too short" }), {
      date,
      articleUrl: () => "https://alghazzi.org/posts/x",
    }), /too short/);
    assert.throws(() => normalizeGeneratedDraft(modelDraft({ slug: "Hello!" }), {
      date,
      articleUrl: () => "https://alghazzi.org/posts/x",
    }), /invalid slug/);
    assert.throws(() => parseModelJson("not json"), /did not return JSON/);
    assert.throws(() => messageText({ choices: [] }), /no text/);
  });
});

describe("daily draft rows", () => {
  it("inserts a desk draft and does not arm publishing or LinkedIn", () => {
    const row = buildDailyDraftInsert(input());
    assert.equal(row.slug, `${date}-hello`);
    assert.equal(row.status, "draft");
    assert.equal(row.published_at, null);
    assert.equal(row.scheduled_for, null);
    assert.equal(row.linkedin_mode, "site");
    assert.equal(row.linkedin_status, "hold");
    assert.equal(row.linkedin_urn, "");
    assert.equal(row.linkedin_url, "");
    assert.equal(row.draft_key, dailyDraftKey(date));
    assert.equal(row.lang, "en");
    assert.equal(row.published_on, date);
  });

  it("keeps the article URL on the unused slug when the first choice is taken", () => {
    const row = buildDailyDraftInsert(input({ existingSlugs: [`${date}-hello`] }));
    assert.equal(row.slug, `${date}-hello-2`);
    assert.equal(row.linkedin_text.endsWith(`https://alghazzi.org/posts/${date}-hello-2`), true);
    assert.equal(row.status, "draft");
  });

  it("leaves an existing day's row alone, including one the owner already published", async () => {
    let inserts = 0;
    const client: DailyDraftClient = {
      async findByKey() {
        return hit({ status: "published", linkedin_status: "posted", linkedin_mode: "both", published_at: "2026-10-21T06:00:00Z", linkedin_urn: "urn:li:share:1" });
      },
      async listPosts() {
        return [];
      },
      async insert() {
        inserts += 1;
        throw new Error("insert should not run");
      },
    };
    const saved = await saveDailyDraft(client, input());
    assert.equal(saved.action, "exists");
    assert.equal(saved.status, "published");
    assert.equal(inserts, 0);
  });

  it("treats a same-day unique conflict as the existing draft", async () => {
    let lookups = 0;
    const client: DailyDraftClient = {
      async findByKey() {
        lookups += 1;
        return lookups === 1 ? null : hit();
      },
      async listPosts() {
        return [];
      },
      async insert() {
        throw new DailyDraftExistsError();
      },
    };
    const saved = await saveDailyDraft(client, input());
    assert.equal(saved.action, "exists");
    assert.equal(saved.slug, `${date}-hello`);
  });

  it("picks another slug when the first one is taken at insert time", async () => {
    const inserted: string[] = [];
    const client: DailyDraftClient = {
      async findByKey() {
        return null;
      },
      async listPosts() {
        return [];
      },
      async insert(row) {
        inserted.push(row.slug);
        if (row.slug === `${date}-hello`) throw new SlugConflictError();
        return hit({ slug: row.slug });
      },
    };
    const saved = await saveDailyDraft(client, input());
    assert.equal(saved.action, "created");
    assert.deepEqual(inserted, [`${date}-hello`, `${date}-hello-2`]);
    assert.equal(saved.slug, `${date}-hello-2`);
  });

  it("refuses a stored row that is not a draft", async () => {
    const client: DailyDraftClient = {
      async findByKey() {
        return null;
      },
      async listPosts() {
        return [];
      },
      async insert(row) {
        return hit({ slug: row.slug, status: "published", published_at: "2026-10-21T06:00:00Z" });
      },
    };
    await assert.rejects(() => saveDailyDraft(client, input()), /only creates drafts/);
  });
});

describe("supabase daily draft client", () => {
  it("inserts only a draft and never calls LinkedIn or a private RPC", async () => {
    const calls: { url: string; method: string; authorization: string; apikey: string; prefer: string; body: DailyDraftRow | null }[] = [];
    const fetchImpl: typeof fetch = async (inputValue, init) => {
      const url = String(inputValue);
      const method = init?.method ?? "GET";
      const headers = new Headers(init?.headers);
      const body = typeof init?.body === "string" ? JSON.parse(init.body) as DailyDraftRow : null;
      calls.push({
        url,
        method,
        authorization: headers.get("authorization") ?? "",
        apikey: headers.get("apikey") ?? "",
        prefer: headers.get("prefer") ?? "",
        body,
      });
      if (method === "POST") {
        return Response.json([{ ...body, linkedin_urn: "", linkedin_url: "" }]);
      }
      return Response.json([]);
    };
    const client = createDailyDraftClient({ url: "https://example.supabase.co", key: "sb_secret_test", fetchImpl });
    assert.equal(await client.findByKey(dailyDraftKey(date)), null);
    const posts = await client.listPosts();
    assert.deepEqual(posts, []);
    const row = buildDailyDraftInsert(input());
    const saved = await client.insert(row);
    assert.equal(saved.status, "draft");
    assert.equal(calls.every((call) => call.authorization === "Bearer sb_secret_test"), true);
    assert.equal(calls.every((call) => call.apikey === "sb_secret_test"), true);
    assert.equal(calls.every((call) => call.url.startsWith("https://example.supabase.co/rest/v1/posts")), true);
    assert.equal(calls.some((call) => call.url.includes(dailyDraftKey(date))), true);
    assert.equal(calls.some((call) => call.url.includes("sb_secret_test")), false);
    assert.equal(calls.some((call) => /\/rpc\/|\/storage\/|linkedin\.com/.test(call.url)), false);
    const insert = calls.find((call) => call.method === "POST");
    assert.equal(insert?.prefer, "return=representation");
    assert.equal(insert?.body?.status, "draft");
    assert.equal(insert?.body?.linkedin_mode, "site");
    assert.equal(insert?.body?.linkedin_status, "hold");
    assert.equal(insert?.body?.published_at, null);
    assert.equal(insert?.body?.scheduled_for, null);
    assert.equal(insert?.body?.draft_key, dailyDraftKey(date));
  });

  it("does not send a row that would publish", async () => {
    let called = false;
    const fetchImpl: typeof fetch = async () => {
      called = true;
      return Response.json([]);
    };
    const client = createDailyDraftClient({ url: "https://example.supabase.co", key: "sb_secret_test", fetchImpl });
    const row = { ...buildDailyDraftInsert(input()), status: "published" } as DailyDraftRow;
    await assert.rejects(() => client.insert(row), /publish or post to LinkedIn/);
    assert.equal(called, false);
  });

  it("classifies a missing column, a duplicate day, and a rejected key", async () => {
    const responses = [
      Response.json({ code: "PGRST204", message: "Could not find the 'draft_key' column of 'posts' in the schema cache" }, { status: 400 }),
      Response.json({
        code: "23505",
        message: 'duplicate key value violates unique constraint "posts_draft_key_key"',
        details: `Key (draft_key)=(${dailyDraftKey(date)}) already exists.`,
      }, { status: 409 }),
      Response.json({
        code: "23505",
        message: 'duplicate key value violates unique constraint "posts_slug_key"',
        details: `Key (slug)=(${date}-hello) already exists.`,
      }, { status: 409 }),
      Response.json({ message: "Invalid API key" }, { status: 401 }),
    ];
    const fetchImpl: typeof fetch = async () => responses.shift() ?? Response.json([]);
    const client = createDailyDraftClient({ url: "https://example.supabase.co", key: "sb_secret_test", fetchImpl });
    await assert.rejects(() => client.findByKey(dailyDraftKey(date)), DraftKeyColumnError);
    await assert.rejects(() => client.insert(buildDailyDraftInsert(input())), DailyDraftExistsError);
    await assert.rejects(() => client.insert(buildDailyDraftInsert(input())), SlugConflictError);
    await assert.rejects(() => client.listPosts(), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /SUPABASE_SECRET_KEY \(401\)/);
      assert.equal(error.message.includes("sb_secret_test"), false);
      return true;
    });
  });

  it("strips the secret key out of a Supabase error", async () => {
    const fetchImpl: typeof fetch = async () => Response.json({ message: "failed with sb_secret_test in the body" }, { status: 500 });
    const client = createDailyDraftClient({ url: "https://example.supabase.co", key: "sb_secret_test", fetchImpl });
    await assert.rejects(() => client.listPosts(), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message.includes("sb_secret_test"), false);
      assert.match(error.message, /\[redacted\]/);
      return true;
    });
  });
});

describe("daily draft job wiring", () => {
  it("keeps the workflow on a read-only checkout and names the desk secrets", () => {
    const workflow = readFileSync(".github/workflows/draft-post.yml", "utf8");
    const script = readFileSync("scripts/draft-post.mjs", "utf8");
    const migration = readFileSync(DRAFT_KEY_MIGRATION, "utf8");
    assert.match(workflow, /cron: "0 4 \* \* \*"/);
    assert.match(workflow, /contents: read/);
    assert.match(workflow, /persist-credentials: false/);
    assert.match(workflow, /secrets\.SUPABASE_URL/);
    assert.match(workflow, /secrets\.SUPABASE_SECRET_KEY/);
    assert.match(workflow, /secrets\.XAI_API_KEY/);
    assert.match(workflow, /secrets\.AI_GATEWAY_API_KEY/);
    assert.match(workflow, /vars\.XAI_MODEL/);
    assert.equal(workflow.includes("contents: write"), false);
    assert.equal(workflow.includes("pull-requests:"), false);
    assert.equal(workflow.includes("GH_TOKEN"), false);
    assert.equal(workflow.includes("GITHUB_TOKEN"), false);
    assert.equal(script.includes("writeFileSync"), false);
    assert.equal(script.includes("execFileSync"), false);
    assert.equal(script.includes("createOwnerPost"), false);
    assert.equal(script.includes("publishToLinkedIn"), false);
    assert.equal(script.includes("linkedin.com"), false);
    assert.match(migration, /draft_key/);
    assert.match(migration, /posts_draft_key_key unique/);
    assert.match(migration, /daily-\[0-9\]\{4\}/);
  });

  it("fails the command when a required secret is missing", () => {
    const result = spawnSync(process.execPath, [
      "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
      "--experimental-strip-types",
      "--import",
      "./scripts/register-ts-test.mjs",
      "scripts/draft-post.mjs",
    ], {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 20_000,
      env: {
        PATH: process.env.PATH ?? "",
        HOME: process.env.HOME ?? "",
      },
    });
    const output = `${result.stdout}\n${result.stderr}`;
    assert.notEqual(result.status, 0);
    assert.match(output, /Missing GitHub Actions secrets: SUPABASE_URL, SUPABASE_SECRET_KEY, XAI_API_KEY or AI_GATEWAY_API_KEY/);
    assert.equal(output.includes("Created draft"), false);
    assert.equal(output.includes("Nothing was published"), false);
  });
});
