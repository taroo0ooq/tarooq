export const DRAFT_KEY_MIGRATION = "supabase/migrations/20261021140000_posts_draft_key.sql";

/** The daily job keeps its historical commentary cap. The desk allows more when a person edits. */
export const DAILY_LINKEDIN_LIMIT = 1200;
const MIN_WORDS = 80;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const SHORT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class DailyDraftExistsError extends Error {
  constructor() {
    super("A draft for this day already exists.");
    this.name = "DailyDraftExistsError";
  }
}

export class SlugConflictError extends Error {
  constructor() {
    super("That slug is already used.");
    this.name = "SlugConflictError";
  }
}

export class DraftKeyColumnError extends Error {
  constructor() {
    super(`The posts table has no draft_key column. Apply ${DRAFT_KEY_MIGRATION}, then rerun the job.`);
    this.name = "DraftKeyColumnError";
  }
}

export type DailyDraftRow = {
  slug: string;
  title: string;
  description: string;
  body: string;
  lang: "en";
  status: "draft";
  published_on: string;
  published_at: null;
  scheduled_for: null;
  cover_path: "";
  cover_alt: "";
  seo_title: "";
  seo_description: "";
  linkedin_text: string;
  linkedin_mode: "site";
  linkedin_status: "hold";
  linkedin_urn: "";
  linkedin_url: "";
  linkedin_error: "";
  draft_key: string;
};

export type DailyDraftHit = {
  slug: string;
  status: string;
  linkedin_status: string;
  linkedin_mode: string;
  published_at: string | null;
  scheduled_for: string | null;
  linkedin_urn: string;
  linkedin_url: string;
};

export type DailyDraftClient = {
  findByKey(draftKey: string): Promise<DailyDraftHit | null>;
  listPosts(): Promise<{ slug: string; title: string }[]>;
  insert(row: DailyDraftRow): Promise<DailyDraftHit>;
};

export type DailyDraftInput = {
  date: string;
  title: string;
  description: string;
  body: string;
  linkedinText: string;
  preferredSlug: string;
  existingSlugs: Iterable<string>;
  articleUrl: (fullSlug: string) => string;
};

type SecretEnv = {
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  XAI_API_KEY?: string;
  AI_GATEWAY_API_KEY?: string;
};

export function dailyDraftKey(date: string) {
  if (!DAY.test(date)) throw new Error("Date is invalid.");
  return `daily-${date}`;
}

export function missingDailyDraftConfig(env: SecretEnv) {
  const missing: string[] = [];
  if (!(env.SUPABASE_URL ?? "").trim()) missing.push("SUPABASE_URL");
  if (!(env.SUPABASE_SECRET_KEY ?? "").trim()) missing.push("SUPABASE_SECRET_KEY");
  if (!(env.XAI_API_KEY ?? "").trim() && !(env.AI_GATEWAY_API_KEY ?? "").trim()) {
    missing.push("XAI_API_KEY or AI_GATEWAY_API_KEY");
  }
  return missing;
}

export function missingDailyDraftMessage(missing: string[]) {
  if (missing.length === 0) return "";
  const label = missing.length === 1 ? "secret" : "secrets";
  return `Missing GitHub Actions ${label}: ${missing.join(", ")}. The daily draft was not created.`;
}

export function assertDailyDraftSecrets(env: SecretEnv) {
  const urlValue = (env.SUPABASE_URL ?? "").trim();
  const key = (env.SUPABASE_SECRET_KEY ?? "").trim();
  if (key.startsWith("sb_publishable_")) {
    throw new Error("SUPABASE_SECRET_KEY must be the server secret key.");
  }
  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    throw new Error("SUPABASE_URL is not a valid URL.");
  }
  if (url.protocol !== "https:") throw new Error("SUPABASE_URL must use https.");
  return { url: url.origin, key };
}

export function formatDailyDraftFailure(error: unknown, secrets: Iterable<string> = []) {
  const message = error instanceof Error ? error.message : "Could not save the draft.";
  let out = message;
  for (const secret of secrets) {
    const value = secret.trim();
    if (value) out = out.split(value).join("[redacted]");
  }
  return out;
}

export function messageText(payload: unknown) {
  const choices = payload && typeof payload === "object" ? (payload as { choices?: unknown }).choices : undefined;
  const first = Array.isArray(choices) ? choices[0] : undefined;
  const message = first && typeof first === "object" ? (first as { message?: unknown }).message : undefined;
  const content = message && typeof message === "object" ? (message as { content?: unknown }).content : undefined;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) return String((part as { text?: unknown }).text || "");
        return "";
      })
      .join("");
  }
  throw new Error("The model response had no text.");
}

export function parseModelJson(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end < start) throw new Error("The model did not return JSON.");
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
  } catch {
    throw new Error("The model did not return JSON.");
  }
}

export function normalizeGeneratedDraft(value: unknown, options: { date: string; articleUrl: (fullSlug: string) => string }) {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const preferredSlug = String(record.slug || "")
    .trim()
    .toLowerCase()
    .replace(/^\d{4}-\d{2}-\d{2}-/, "");
  if (!SHORT_SLUG.test(preferredSlug) || preferredSlug.length > 60) {
    throw new Error("The model returned an invalid slug.");
  }
  const title = String(record.title || "").replace(/\s+/g, " ").trim();
  const description = String(record.description || "").replace(/\s+/g, " ").trim();
  const body = String(record.bodyMarkdown || "").trim();
  let linkedinText = String(record.linkedinText || "").trim();
  const articleUrl = options.articleUrl(`${options.date}-${preferredSlug}`);
  if (!title || !description || !body || !linkedinText) {
    throw new Error("The model JSON is missing a required field.");
  }
  if (title.length > 140) throw new Error("The title is longer than 140 characters.");
  if (description.length > 400) throw new Error("The description is longer than 400 characters.");
  if (body.length > 20_000) throw new Error("The article is too long to save a draft.");
  if (body.split(/\s+/).length < MIN_WORDS) throw new Error("The article is too short to save a draft.");
  if (!linkedinText.includes(articleUrl)) linkedinText = `${linkedinText}\n\n${articleUrl}`;
  if (linkedinText.length > DAILY_LINKEDIN_LIMIT) throw new Error("linkedinText is longer than 1200 characters.");
  return { title, description, body, linkedinText, preferredSlug };
}

export function chooseDailySlug(date: string, preferred: string, existingSlugs: Iterable<string>) {
  if (!DAY.test(date)) throw new Error("Date is invalid.");
  if (!SHORT_SLUG.test(preferred) || preferred.length > 60) throw new Error("The model returned an invalid slug.");
  const taken = new Set(existingSlugs);
  for (let n = 1; n < 50; n += 1) {
    const short = n === 1 ? preferred : `${preferred}-${n}`;
    const slug = `${date}-${short}`;
    if (slug.length <= 80 && !taken.has(slug)) return slug;
  }
  throw new Error("Could not find an unused slug.");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceArticleUrl(text: string, fromUrl: string, toUrl: string) {
  if (fromUrl === toUrl) return text;
  return text.replace(new RegExp(`${escapeRegExp(fromUrl)}(?![A-Za-z0-9-])`, "g"), toUrl);
}

export function buildDailyDraftInsert(input: DailyDraftInput): DailyDraftRow {
  const slug = chooseDailySlug(input.date, input.preferredSlug, input.existingSlugs);
  const fromUrl = input.articleUrl(`${input.date}-${input.preferredSlug}`);
  const toUrl = input.articleUrl(slug);
  let linkedinText = replaceArticleUrl(input.linkedinText, fromUrl, toUrl);
  if (!linkedinText.includes(toUrl)) linkedinText = linkedinText ? `${linkedinText}\n\n${toUrl}` : toUrl;
  if (linkedinText.length > DAILY_LINKEDIN_LIMIT) throw new Error("linkedinText is longer than 1200 characters.");
  return {
    slug,
    title: input.title,
    description: input.description,
    body: input.body,
    lang: "en",
    status: "draft",
    published_on: input.date,
    published_at: null,
    scheduled_for: null,
    cover_path: "",
    cover_alt: "",
    seo_title: "",
    seo_description: "",
    linkedin_text: linkedinText,
    linkedin_mode: "site",
    linkedin_status: "hold",
    linkedin_urn: "",
    linkedin_url: "",
    linkedin_error: "",
    draft_key: dailyDraftKey(input.date),
  };
}

function assertSendable(row: DailyDraftRow) {
  if (
    row.status !== "draft" ||
    row.linkedin_mode !== "site" ||
    row.linkedin_status !== "hold" ||
    row.published_at !== null ||
    row.scheduled_for !== null ||
    row.linkedin_urn !== "" ||
    row.linkedin_url !== ""
  ) {
    throw new Error("Refusing to save a daily draft that would publish or post to LinkedIn.");
  }
}

function assertStoredDraft(row: DailyDraftHit) {
  const draftOnly = row.status === "draft"
    && !row.published_at
    && !row.scheduled_for
    && row.linkedin_status === "hold"
    && row.linkedin_mode === "site"
    && !row.linkedin_urn
    && !row.linkedin_url;
  if (!draftOnly) {
    throw new Error(`Refusing to continue: ${row.slug || "the post"} was stored as ${row.status || "unknown"} with LinkedIn ${row.linkedin_status || "unset"}. The daily job only creates drafts.`);
  }
}

export async function saveDailyDraft(client: DailyDraftClient, input: DailyDraftInput) {
  const key = dailyDraftKey(input.date);
  const existing = await client.findByKey(key);
  if (existing) return { action: "exists" as const, slug: existing.slug, status: existing.status };
  const taken = new Set(input.existingSlugs);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = buildDailyDraftInsert({ ...input, existingSlugs: taken });
    try {
      const saved = await client.insert(row);
      assertStoredDraft(saved);
      return { action: "created" as const, slug: saved.slug, status: "draft" as const };
    } catch (error) {
      if (error instanceof DailyDraftExistsError) {
        const again = await client.findByKey(key);
        if (!again) throw new Error(`A draft for ${input.date} already exists, but it could not be read back.`);
        return { action: "exists" as const, slug: again.slug, status: again.status };
      }
      if (error instanceof SlugConflictError) {
        taken.add(row.slug);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Could not find an unused slug.");
}

type ErrorBody = { message?: string; details?: string; code?: string };

function asHit(value: unknown): DailyDraftHit {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    slug: typeof record.slug === "string" ? record.slug : "",
    status: typeof record.status === "string" ? record.status : "",
    linkedin_status: typeof record.linkedin_status === "string" ? record.linkedin_status : "",
    linkedin_mode: typeof record.linkedin_mode === "string" ? record.linkedin_mode : "",
    published_at: typeof record.published_at === "string" ? record.published_at : null,
    scheduled_for: typeof record.scheduled_for === "string" ? record.scheduled_for : null,
    linkedin_urn: typeof record.linkedin_urn === "string" ? record.linkedin_urn : "",
    linkedin_url: typeof record.linkedin_url === "string" ? record.linkedin_url : "",
  };
}

function asSummary(value: unknown) {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    slug: typeof record.slug === "string" ? record.slug : "",
    title: typeof record.title === "string" ? record.title : "",
  };
}

export function createDailyDraftClient(options: { url: string; key: string; fetchImpl?: typeof fetch }): DailyDraftClient {
  const base = options.url.replace(/\/$/, "");
  const key = options.key.trim();
  if (!base || !key) throw new Error("Supabase is not configured.");
  if (key.startsWith("sb_publishable_")) throw new Error("SUPABASE_SECRET_KEY must be the server secret key.");
  const fetchImpl = options.fetchImpl ?? fetch;
  const select = "slug,status,linkedin_status,linkedin_mode,published_at,scheduled_for,linkedin_urn,linkedin_url";

  function redact(value: string) {
    return key ? value.split(key).join("[redacted]") : value;
  }

  async function request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("apikey", key);
    headers.set("authorization", `Bearer ${key}`);
    headers.set("accept", "application/json");
    let response: Response;
    try {
      response = await fetchImpl(`${base}${path}`, { ...init, headers, redirect: "error" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Supabase could not be reached.";
      throw new Error(redact(`Supabase could not be reached. ${message}`).slice(0, 400));
    }
    const text = await response.text();
    if (!response.ok) throw supabaseFailure(response.status, text);
    if (!text) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error("Supabase returned a response that was not JSON.");
    }
  }

  function supabaseFailure(status: number, text: string) {
    let parsed: ErrorBody = {};
    try {
      parsed = JSON.parse(text) as ErrorBody;
    } catch {
      parsed = { message: text.slice(0, 400) };
    }
    const message = parsed.message || "";
    const details = parsed.details || "";
    const combined = `${message} ${details}`;
    if (parsed.code === "PGRST204" || (/draft_key/.test(combined) && /schema cache|does not exist|could not find/i.test(combined))) {
      return new DraftKeyColumnError();
    }
    if (status === 401 || status === 403) return new Error(`Supabase rejected SUPABASE_SECRET_KEY (${status}).`);
    if (status === 409 && /draft_key/.test(combined)) return new DailyDraftExistsError();
    if (status === 409 && /slug/.test(combined)) return new SlugConflictError();
    const detail = redact(message || text).slice(0, 300);
    return new Error(`Supabase rejected the draft (${status}): ${detail}`);
  }

  return {
    async findByKey(draftKey) {
      const payload = await request(`/rest/v1/posts?select=${select}&draft_key=eq.${encodeURIComponent(draftKey)}&limit=1`);
      const rows = Array.isArray(payload) ? payload : [];
      return rows[0] ? asHit(rows[0]) : null;
    },
    async listPosts() {
      const payload = await request("/rest/v1/posts?select=slug,title&limit=1000");
      return Array.isArray(payload) ? payload.map(asSummary).filter((post) => post.slug) : [];
    },
    async insert(row) {
      assertSendable(row);
      const payload = await request("/rest/v1/posts?select=" + select, {
        method: "POST",
        headers: { "content-type": "application/json", prefer: "return=representation" },
        body: JSON.stringify(row),
      });
      const rows = Array.isArray(payload) ? payload : [];
      if (!rows[0]) throw new Error("Supabase did not return the draft.");
      return asHit(rows[0]);
    },
  };
}
