import { handleChatRequest } from "@/lib/chat-http";
import { loadChatCorpus } from "@/lib/chat-load";
import { streamChatAnswer } from "@/lib/chat-model";
import { chatRateStoreFromEnv } from "@/lib/chat-rate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  return handleChatRequest(request, {
    store: chatRateStoreFromEnv(),
    secret: process.env.SUPABASE_SECRET_KEY?.trim() || "",
    loadCorpus: loadChatCorpus,
    complete: streamChatAnswer,
  });
}
