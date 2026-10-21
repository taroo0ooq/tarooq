import { streamText, type LanguageModel } from "ai";
import { CHAT_MAX_OUTPUT_TOKENS, CHAT_MODEL } from "./chat-limits";
import type { ModelTurn } from "./chat-policy";

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
  });
  for await (const delta of result.textStream) {
    if (signal.aborted) break;
    yield delta;
  }
}
