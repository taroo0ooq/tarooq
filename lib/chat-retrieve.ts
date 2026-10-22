import type { Locale } from "./locale";
import type { ChatChunk } from "./chat-corpus";

const stopwords = new Set([
  "a", "an", "the", "of", "and", "or", "to", "for", "in", "on", "at", "by", "is", "are", "was", "were",
  "be", "what", "who", "how", "does", "do", "did", "his", "her", "he", "she", "it", "with", "about",
  "your", "you", "me", "my", "please", "tell", "from", "that", "this", "as", "if", "can", "could",
  "would", "should", "there", "their", "was", "were", "been", "have", "has", "had", "i", "we", "our",
  "ما", "هو", "هي", "في", "من", "عن", "هل", "و", "إلى", "الى", "على", "هذا", "هذه", "التي", "الذي",
  "ان", "أن", "أو", "او", "ثم", "مع", "بعد", "قبل", "كيف", "ماذا", "لماذا", "يا", "ذلك", "تلك",
]);

export function tokenize(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !stopwords.has(token));
}

export type ScoredChunk = { chunk: ChatChunk; score: number };

export function retrieveChunks(chunks: ChatChunk[], query: string, locale: Locale, limit = 6) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return { hits: [] as ScoredChunk[], confident: false };
  const phrase = query.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  const scored = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(tokens, phrase, chunk, locale) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id));
  const hits = scored.slice(0, limit);
  const best = hits[0]?.score ?? 0;
  const distinctive = tokens.some((token) => token.length >= 4 && hits.some((hit) => hit.chunk.text.toLowerCase().includes(token) || hit.chunk.text.includes(token)));
  return { hits, confident: best >= 3 || (best >= 2 && distinctive) };
}

function scoreChunk(tokens: string[], phrase: string, chunk: ChatChunk, locale: Locale) {
  const haystack = chunk.text.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += token.length >= 5 ? 2 : 1;
  }
  if (phrase.length >= 8 && haystack.includes(phrase)) score += 3;
  if (chunk.locale === locale || chunk.locale === "both") score += score > 0 ? 1 : 0;
  return score;
}
