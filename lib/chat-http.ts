import { chatCopy } from "./chat-copy";
import type { ChatChunk } from "./chat-corpus";
import { CHAT_BODY_CHARS, CHAT_RATE_LIMIT, CHAT_RATE_WINDOW_MS } from "./chat-limits";
import { createAnswerGuard, prepareChatTurn, type ModelTurn } from "./chat-policy";
import { hashVisitorIp, type ChatRateStore } from "./chat-rate";
import { logChatModelFailure } from "./chat-model";
import { turnstileVisitorIp, verifyTurnstile } from "./turnstile";
import type { Locale } from "./locale";

export type ChatComplete = (turn: ModelTurn, signal: AbortSignal) => AsyncIterable<string>;

export type ChatDeps = {
  store: ChatRateStore | null;
  secret: string;
  loadCorpus: () => Promise<ChatChunk[]>;
  complete: ChatComplete;
  now?: number;
  verify?: (token: unknown, remoteip: string) => Promise<boolean>;
};

function json(locale: Locale, status: number, message: string, retryAfter = 0) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex",
  });
  if (retryAfter > 0) headers.set("Retry-After", String(retryAfter));
  return new Response(JSON.stringify({ ok: false, message }), { status, headers });
}

function plain(body: ReadableStream<Uint8Array> | string, status = 200) {
  const headers = new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex",
  });
  const stream = typeof body === "string" ? chunked(body) : body;
  return new Response(stream, { status, headers });
}

function chunked(text: string) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const size = 48;
      for (let index = 0; index < text.length; index += size) {
        controller.enqueue(encoder.encode(text.slice(index, index + size)));
      }
      controller.close();
    },
  });
}

/** Stable client address. Drops a per-connection port so the rate-limit hash does not change between requests. */
export function normalizeVisitorIp(value: string | null | undefined) {
  if (!value) return "";
  let text = value.trim().replace(/^"+|"+$/g, "").trim();
  if (!text || /^unknown$/i.test(text)) return "";
  if (text.startsWith("[")) {
    const end = text.indexOf("]");
    if (end > 1) text = text.slice(1, end);
  } else {
    const port = text.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (port?.[1]) text = port[1];
  }
  const mapped = text.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped?.[1]) text = mapped[1];
  return text.toLowerCase();
}

export function visitorIp(request: Request) {
  const real = normalizeVisitorIp(request.headers.get("x-real-ip"));
  if (real) return real;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = normalizeVisitorIp(forwarded.split(",")[0] ?? "");
    if (first) return first;
  }
  return "unknown";
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || "";
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function readLocale(value: unknown): Locale | null {
  if (value === "ar" || value === "en") return value;
  return null;
}

function userTurns(messages: unknown) {
  if (!Array.isArray(messages)) return 0;
  return messages.filter((item) => {
    if (!item || typeof item !== "object") return false;
    return (item as { role?: unknown }).role === "user";
  }).length;
}

function guardedStream(source: AsyncIterable<string>, context: string, locale: Locale) {
  const encoder = new TextEncoder();
  const guard = createAnswerGuard(context, locale);
  const copy = chatCopy(locale);
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of source) {
          const piece = guard.push(delta);
          if (piece) controller.enqueue(encoder.encode(piece));
          if (guard.blocked) break;
        }
        const tail = guard.finish();
        if (tail) controller.enqueue(encoder.encode(tail));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        logChatModelFailure(error);
        if (!guard.sent) controller.enqueue(encoder.encode(copy.unavailable));
      } finally {
        controller.close();
      }
    },
  });
}

export async function handleChatRequest(request: Request, deps: ChatDeps) {
  const headerLocale = readLocale(request.headers.get("x-chat-locale")) ?? "en";
  const copyFor = (locale: Locale) => chatCopy(locale);
  if (!sameOrigin(request)) return json(headerLocale, 403, copyFor(headerLocale).forbidden);
  const advertised = Number(request.headers.get("content-length") || 0);
  if (advertised > CHAT_BODY_CHARS) return json(headerLocale, 413, copyFor(headerLocale).tooLarge);

  if (!deps.store || !deps.secret) return json(headerLocale, 503, copyFor(headerLocale).unavailable);
  const now = deps.now ?? Date.now();
  const key = hashVisitorIp(visitorIp(request), deps.secret);
  let limited;
  try {
    limited = await deps.store.consume(key, CHAT_RATE_LIMIT, CHAT_RATE_WINDOW_MS, now);
  } catch {
    return json(headerLocale, 503, copyFor(headerLocale).unavailable);
  }
  if (!limited.ok) return json(headerLocale, 429, copyFor(headerLocale).rate, limited.retryAfter);

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return json(headerLocale, 400, copyFor(headerLocale).invalid);
  }
  if (raw.length > CHAT_BODY_CHARS) return json(headerLocale, 413, copyFor(headerLocale).tooLarge);
  let payload: unknown;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    return json(headerLocale, 400, copyFor(headerLocale).invalid);
  }
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const locale = readLocale(record.locale);
  if (!locale) return json(headerLocale, 400, copyFor(headerLocale).invalid);

  if (userTurns(record.messages) === 1) {
    const verify = deps.verify ?? verifyTurnstile;
    const allowed = await verify(record.turnstileToken, turnstileVisitorIp(request));
    if (!allowed) return json(locale, 400, copyFor(locale).turnstile);
  }

  let corpus: ChatChunk[];
  try {
    corpus = await deps.loadCorpus();
  } catch {
    return json(locale, 503, copyFor(locale).unavailable);
  }
  const turn = prepareChatTurn({ locale, messages: record.messages, corpus });
  if (turn.kind === "invalid") return json(locale, 400, turn.message);
  if (turn.kind === "text") return plain(turn.text);
  let source: AsyncIterable<string>;
  try {
    source = deps.complete(turn, request.signal);
  } catch (error) {
    logChatModelFailure(error);
    return plain(copyFor(locale).unavailable);
  }
  return plain(guardedStream(source, turn.context, locale));
}
