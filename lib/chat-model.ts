import { streamText, type LanguageModel } from "ai";
import { CHAT_MAX_OUTPUT_TOKENS, CHAT_MODEL } from "./chat-limits";
import type { ModelTurn } from "./chat-policy";
import { redactSecrets } from "./secrets";

export type ChatModelPart = { type: string; text?: string; error?: unknown };

export function chatModelFailureDetail(error: unknown) {
  const status = error && typeof error === "object" && "statusCode" in error ? (error as { statusCode?: unknown }).statusCode : undefined;
  const message = error instanceof Error ? error.message : "Chat model request failed.";
  const clean = redactSecrets(message).replace(/\s+/g, " ").slice(0, 300);
  const code = typeof status === "number" ? ` (${status})` : "";
  return `Chat model failed${code}: ${clean}`;
}

export function logChatModelFailure(error: unknown) {
  console.error(chatModelFailureDetail(error));
}

/** Reads gateway stream parts. An error part fails the call instead of looking like an empty answer. */
export async function* deltasFromModelStream(parts: AsyncIterable<ChatModelPart>, signal?: AbortSignal): AsyncIterable<string> {
  let failure: unknown = null;
  try {
    for await (const part of parts) {
      if (signal?.aborted) return;
      if (part.type === "error") {
        failure = part.error instanceof Error ? part.error : new Error("Chat model request failed.");
        break;
      }
      if (part.type === "text-delta" && part.text) yield part.text;
    }
  } catch (error) {
    if (signal?.aborted) return;
    throw error;
  }
  if (failure) throw failure;
}

const modelPattern = /^[a-z0-9][a-z0-9.-]*\/[a-zA-Z0-9._:-]+$/;

export function chatModelId() {
  const override = process.env.AI_GATEWAY_MODEL?.trim() || "";
  if (override && modelPattern.test(override)) return override;
  return CHAT_MODEL;
}

function chatModel(): LanguageModel {
  return chatModelId() as LanguageModel;
}

export async function* streamChatAnswer(turn: ModelTurn, signal: AbortSignal): AsyncIterable<string> {
  let reported: unknown = null;
  const result = streamText({
    model: chatModel(),
    instructions: turn.instructions,
    messages: [{ role: "user", content: turn.content }],
    maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
    temperature: 0.2,
    maxRetries: 1,
    timeout: 25_000,
    abortSignal: signal,
    toolChoice: "none",
    onError({ error }) {
      reported = error;
    },
  });
  yield* deltasFromModelStream(result.stream, signal);
  if (reported) throw reported instanceof Error ? reported : new Error("Chat model request failed.");
}
