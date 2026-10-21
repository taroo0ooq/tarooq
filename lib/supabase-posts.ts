import { absoluteStorageUrl, assertDocumentPath, assertSignedUploadUrl, DOCUMENT_BUCKET } from "./post-document";
import type { ClaimResult, LinkedInConnectionRow, PostInsert, PostRow, PostsDb } from "./post-types";

export class SupabaseRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SupabaseRequestError";
    this.status = status;
  }
}

const COLUMNS = [
  "id",
  "slug",
  "title",
  "description",
  "body",
  "lang",
  "status",
  "published_on",
  "published_at",
  "scheduled_for",
  "cover_path",
  "cover_alt",
  "seo_title",
  "seo_description",
  "linkedin_text",
  "linkedin_mode",
  "linkedin_status",
  "linkedin_urn",
  "linkedin_url",
  "linkedin_error",
  "link_placement",
  "first_comment",
  "doc_path",
  "doc_title",
  "created_at",
  "updated_at",
] as const;

function asRow(value: unknown): PostRow {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const row = {} as PostRow;
  for (const key of COLUMNS) {
    const field = record[key];
    (row as Record<string, unknown>)[key] = field ?? (key.endsWith("_at") || key === "scheduled_for" ? null : "");
  }
  const placement = record.link_placement;
  if (placement === "text" || placement === "comment") row.link_placement = placement;
  else row.link_placement = row.linkedin_status === "posted" || row.linkedin_urn.startsWith("urn:") ? "text" : "comment";
  return row;
}

function safeObjectPath(objectPath: string) {
  if (!objectPath || objectPath.includes("..") || objectPath.startsWith("/") || objectPath.includes("\\")) {
    throw new SupabaseRequestError("Image path is invalid.", 400);
  }
  return objectPath.split("/").map((part) => encodeURIComponent(part)).join("/");
}

export function createSupabasePostsDb(options: { url: string; key: string; fetchImpl?: typeof fetch }): PostsDb {
  const base = options.url.replace(/\/$/, "");
  const key = options.key.trim();
  if (!base || !key) throw new SupabaseRequestError("Supabase is not configured.", 503);
  if (key.startsWith("sb_publishable_")) {
    throw new SupabaseRequestError("SUPABASE_SECRET_KEY must be the server secret key.", 500);
  }
  const fetchImpl = options.fetchImpl ?? fetch;

  async function request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("apikey", key);
    headers.set("authorization", `Bearer ${key}`);
    if (!headers.has("accept")) headers.set("accept", "application/json");
    let response: Response;
    try {
      response = await fetchImpl(`${base}${path}`, { ...init, headers });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Supabase could not be reached.";
      throw new SupabaseRequestError(message, 0);
    }
    const text = await response.text();
    if (!response.ok) {
      let message = text.slice(0, 400) || response.statusText;
      try {
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // Keep the raw body.
      }
      throw new SupabaseRequestError(message, response.status);
    }
    if (!text) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  async function rows(path: string, init?: RequestInit) {
    const payload = await request(path, init);
    return Array.isArray(payload) ? payload.map(asRow) : [];
  }

  async function readStoredObject(bucket: string, objectPath: string, failure: string) {
    const headers = new Headers({
      apikey: key,
      authorization: `Bearer ${key}`,
    });
    const response = await fetchImpl(`${base}/storage/v1/object/${bucket}/${safeObjectPath(objectPath)}`, { headers });
    if (response.status === 404) return null;
    if (!response.ok) throw new SupabaseRequestError(failure, response.status);
    return {
      bytes: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") || "application/octet-stream",
    };
  }

  return {
    async list() {
      return rows("/rest/v1/posts?select=*&order=published_on.desc,slug.desc");
    },
    async hasAny() {
      const found = await rows("/rest/v1/posts?select=id&limit=1");
      return found.length > 0;
    },
    async getBySlug(slug) {
      const found = await rows(`/rest/v1/posts?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);
      return found[0] ?? null;
    },
    async insert(row) {
      const inserted = await rows("/rest/v1/posts?select=*", {
        method: "POST",
        headers: { "content-type": "application/json", prefer: "return=representation" },
        body: JSON.stringify(row),
      });
      if (!inserted[0]) throw new SupabaseRequestError("Supabase did not return the post.", 502);
      return inserted[0];
    },
    async update(slug, patch) {
      const body: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(patch)) {
        if (value !== undefined) body[field] = value;
      }
      const updated = await rows(`/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&select=*`, {
        method: "PATCH",
        headers: { "content-type": "application/json", prefer: "return=representation" },
        body: JSON.stringify(body),
      });
      return updated[0] ?? null;
    },
    async remove(slug) {
      await request(`/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}`, { method: "DELETE" });
    },
    async claimLinkedIn(postId) {
      const payload = await request("/rest/v1/rpc/claim_linkedin_publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ p_post_id: postId }),
      });
      const record = payload && typeof payload === "object" ? (payload as Partial<ClaimResult>) : {};
      return {
        claimed: record.claimed === true,
        state: typeof record.state === "string" ? record.state : "",
        urn: typeof record.urn === "string" ? record.urn : "",
        url: typeof record.url === "string" ? record.url : "",
      };
    },
    async finishLinkedIn(postId, urn, url) {
      await request("/rest/v1/rpc/finish_linkedin_publish", {
        method: "POST",
        headers: { "content-type": "application/json", prefer: "return=minimal" },
        body: JSON.stringify({ p_post_id: postId, p_urn: urn, p_url: url }),
      });
    },
    async failLinkedIn(postId, error, release) {
      await request("/rest/v1/rpc/fail_linkedin_publish", {
        method: "POST",
        headers: { "content-type": "application/json", prefer: "return=minimal" },
        body: JSON.stringify({ p_post_id: postId, p_error: error.slice(0, 500), p_release: release }),
      });
    },
    async releaseLinkedIn(postId) {
      await request("/rest/v1/rpc/release_linkedin_claim", {
        method: "POST",
        headers: { "content-type": "application/json", prefer: "return=minimal" },
        body: JSON.stringify({ p_post_id: postId }),
      });
    },
    async uploadImage(objectPath, bytes, contentType) {
      await request(`/storage/v1/object/post-images/${safeObjectPath(objectPath)}`, {
        method: "POST",
        headers: { "content-type": contentType, "x-upsert": "true" },
        body: new Uint8Array(bytes),
      });
    },
    async deleteImage(objectPath) {
      try {
        await request(`/storage/v1/object/post-images/${safeObjectPath(objectPath)}`, { method: "DELETE" });
      } catch (error) {
        if (error instanceof SupabaseRequestError && error.status === 404) return;
        throw error;
      }
    },
    async readImage(objectPath) {
      return readStoredObject("post-images", objectPath, "The cover image could not be read.");
    },
    async uploadDocument(objectPath, bytes) {
      assertDocumentPath(objectPath);
      await request(`/storage/v1/object/${DOCUMENT_BUCKET}/${safeObjectPath(objectPath)}`, {
        method: "POST",
        headers: { "content-type": "application/pdf", "x-upsert": "true" },
        body: new Uint8Array(bytes),
      });
    },
    async deleteDocument(objectPath) {
      assertDocumentPath(objectPath);
      try {
        await request(`/storage/v1/object/${DOCUMENT_BUCKET}/${safeObjectPath(objectPath)}`, { method: "DELETE" });
      } catch (error) {
        if (error instanceof SupabaseRequestError && error.status === 404) return;
        throw error;
      }
    },
    async readDocument(objectPath) {
      assertDocumentPath(objectPath);
      return readStoredObject(DOCUMENT_BUCKET, objectPath, "The PDF could not be read.");
    },
    async createDocumentUpload(objectPath) {
      assertDocumentPath(objectPath);
      const payload = await request(`/storage/v1/object/upload/sign/${DOCUMENT_BUCKET}/${safeObjectPath(objectPath)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const record = payload && typeof payload === "object" ? (payload as { url?: unknown; token?: unknown }) : {};
      const relative = typeof record.url === "string" ? record.url : "";
      const token = typeof record.token === "string" ? record.token : "";
      if (!relative || !token) throw new SupabaseRequestError("Supabase did not return an upload URL.", 502);
      const signedUrl = absoluteStorageUrl(base, relative);
      assertSignedUploadUrl(signedUrl, base);
      return { path: objectPath, token, signedUrl };
    },
    async saveConnection(row) {
      await request("/rest/v1/rpc/save_linkedin_connection", {
        method: "POST",
        headers: { "content-type": "application/json", prefer: "return=minimal" },
        body: JSON.stringify({
          p_access_token: row.access_token,
          p_expires_at: row.expires_at,
          p_person_id: row.person_id,
          p_person_urn: row.person_urn,
          p_name: row.name,
          p_email: row.email,
        }),
      });
    },
    async getConnection() {
      const payload = await request("/rest/v1/rpc/linkedin_connection", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const first = Array.isArray(payload) ? payload[0] : payload;
      if (!first || typeof first !== "object") return null;
      const record = first as Partial<LinkedInConnectionRow>;
      if (typeof record.access_token !== "string" || !record.access_token) return null;
      return {
        access_token: record.access_token,
        expires_at: record.expires_at ?? "",
        person_id: record.person_id ?? "",
        person_urn: record.person_urn ?? "",
        name: record.name ?? "",
        email: record.email ?? "",
        updated_at: record.updated_at ?? "",
      };
    },
  };
}

export function postsDbFromEnv(fetchImpl?: typeof fetch) {
  const url = process.env.SUPABASE_URL?.trim() || "";
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || "";
  if (!url || !key) return null;
  return createSupabasePostsDb({ url, key, fetchImpl });
}
