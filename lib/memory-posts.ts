import { randomUUID } from "node:crypto";
import type { ClaimResult, LinkedInConnectionRow, PostInsert, PostRow, PostsDb } from "./post-types";

type Claim = { state: "posting" | "posted"; urn: string; url: string; error: string };

function sortRows(rows: PostRow[]) {
  return [...rows].sort((a, b) => b.published_on.localeCompare(a.published_on) || b.slug.localeCompare(a.slug));
}

export function createMemoryPostsDb(): PostsDb {
  const rows: PostRow[] = [];
  const claims = new Map<string, Claim>();
  const images = new Map<string, { bytes: Buffer; contentType: string }>();
  let connection: LinkedInConnectionRow | null = null;

  function requireRow(slug: string) {
    return rows.find((row) => row.slug === slug) ?? null;
  }

  return {
    async list() {
      return sortRows(rows);
    },
    async hasAny() {
      return rows.length > 0;
    },
    async getBySlug(slug) {
      return requireRow(slug);
    },
    async insert(row) {
      if (rows.some((item) => item.slug === row.slug)) {
        const error = new Error("duplicate slug") as Error & { status?: number };
        error.status = 409;
        throw error;
      }
      const now = new Date().toISOString();
      const saved: PostRow = { ...row, id: randomUUID(), created_at: now, updated_at: now };
      rows.push(saved);
      return saved;
    },
    async update(slug, patch) {
      const current = requireRow(slug);
      if (!current) return null;
      const next = { ...current, updated_at: new Date().toISOString() };
      for (const [key, value] of Object.entries(patch) as [keyof PostInsert, PostInsert[keyof PostInsert]][]) {
        if (value !== undefined) {
          (next as Record<string, unknown>)[key] = value;
        }
      }
      const index = rows.findIndex((row) => row.id === current.id);
      rows[index] = next;
      return next;
    },
    async remove(slug) {
      const index = rows.findIndex((row) => row.slug === slug);
      if (index >= 0) {
        claims.delete(rows[index].id);
        rows.splice(index, 1);
      }
    },
    async claimLinkedIn(postId) {
      const existing = claims.get(postId);
      if (existing) return { claimed: false, state: existing.state, urn: existing.urn, url: existing.url };
      claims.set(postId, { state: "posting", urn: "", url: "", error: "" });
      return { claimed: true, state: "posting", urn: "", url: "" } satisfies ClaimResult;
    },
    async finishLinkedIn(postId, urn, url) {
      const existing = claims.get(postId);
      if (existing?.state === "posted" && existing.urn !== urn) {
        throw new Error("LinkedIn id is already recorded");
      }
      claims.set(postId, { state: "posted", urn, url, error: "" });
      const row = rows.find((item) => item.id === postId);
      if (!row) return;
      row.linkedin_status = "posted";
      row.linkedin_urn = urn;
      row.linkedin_url = url;
      row.linkedin_error = "";
      row.updated_at = new Date().toISOString();
    },
    async failLinkedIn(postId, error, release) {
      const row = rows.find((item) => item.id === postId);
      if (row) {
        row.linkedin_status = "failed";
        row.linkedin_error = error.slice(0, 500);
        row.updated_at = new Date().toISOString();
      }
      const claim = claims.get(postId);
      if (!claim || claim.state === "posted") return;
      if (release) claims.delete(postId);
      else claim.error = error.slice(0, 500);
    },
    async releaseLinkedIn(postId) {
      const claim = claims.get(postId);
      if (claim && claim.state !== "posted") claims.delete(postId);
    },
    async uploadImage(objectPath, bytes, contentType) {
      images.set(objectPath, { bytes: Buffer.from(bytes), contentType });
    },
    async deleteImage(objectPath) {
      images.delete(objectPath);
    },
    async readImage(objectPath) {
      return images.get(objectPath) ?? null;
    },
    async saveConnection(row) {
      connection = { ...row, updated_at: new Date().toISOString() };
    },
    async getConnection() {
      return connection;
    },
  };
}
