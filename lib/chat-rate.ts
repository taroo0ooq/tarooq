import { createHmac } from "node:crypto";
import { CHAT_RATE_LIMIT, CHAT_RATE_WINDOW_MS } from "./chat-limits";

export type RateDecision = { ok: true; retryAfter: 0 } | { ok: false; retryAfter: number };

export type RateRow = { hits: number; start: number; expires: number };

export type ChatRateStore = {
  consume(keyHash: string, limit: number, windowMs: number, now: number): Promise<RateDecision>;
};

export function hashVisitorIp(ip: string, secret: string) {
  return createHmac("sha256", secret).update(ip.trim() || "unknown").digest("hex");
}

/** Shared counter rules. Production uses the same window inside Postgres. */
export function consumeWindow(rows: Map<string, RateRow>, key: string, limit: number, windowMs: number, now: number): RateDecision {
  for (const [id, row] of rows) {
    if (row.expires <= now) rows.delete(id);
  }
  const current = rows.get(key);
  if (!current || current.expires <= now) {
    rows.set(key, { hits: 1, start: now, expires: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  const hits = Math.min(current.hits + 1, 1000);
  rows.set(key, { ...current, hits });
  if (hits > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((current.expires - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

export class ChatRateError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ChatRateError";
    this.status = status;
  }
}

type RatePayload = { allowed?: boolean; retry_after?: number };

export function createSupabaseChatRateStore(options: { url: string; key: string; fetchImpl?: typeof fetch }): ChatRateStore {
  const base = options.url.replace(/\/$/, "");
  const key = options.key.trim();
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    async consume(keyHash, limit, windowMs) {
      if (!/^[0-9a-f]{64}$/.test(keyHash)) throw new ChatRateError("invalid rate key", 400);
      let response: Response;
      try {
        response = await fetchImpl(`${base}/rest/v1/rpc/consume_chat_rate_limit`, {
          method: "POST",
          headers: {
            apikey: key,
            authorization: `Bearer ${key}`,
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            p_key_hash: keyHash,
            p_limit: limit,
            p_window_seconds: Math.max(1, Math.round(windowMs / 1000)),
          }),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Supabase could not be reached.";
        throw new ChatRateError(message, 0);
      }
      const text = await response.text();
      if (!response.ok) throw new ChatRateError(text.slice(0, 300) || response.statusText, response.status);
      let payload: unknown = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        throw new ChatRateError("Rate limit response was not JSON.", 502);
      }
      const record = (Array.isArray(payload) ? payload[0] : payload) as RatePayload | null;
      if (!record || typeof record.allowed !== "boolean") throw new ChatRateError("Rate limit response was empty.", 502);
      if (record.allowed) return { ok: true as const, retryAfter: 0 as const };
      const retryAfter = Math.max(1, Number(record.retry_after) || 1);
      return { ok: false as const, retryAfter };
    },
  };
}

export function chatRateStoreFromEnv(env: NodeJS.ProcessEnv = process.env, fetchImpl?: typeof fetch): ChatRateStore | null {
  const url = env.SUPABASE_URL?.trim() || "";
  const key = env.SUPABASE_SECRET_KEY?.trim() || "";
  if (!url || !key) return null;
  return createSupabaseChatRateStore({ url, key, fetchImpl });
}

export const chatRateLimit = CHAT_RATE_LIMIT;
export const chatRateWindowMs = CHAT_RATE_WINDOW_MS;
