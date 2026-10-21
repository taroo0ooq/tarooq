/** Caps for the visitor chatbot. The privacy page states the ten-minute rate window. */
export const CHAT_MODEL = "openai/gpt-4.1-mini" as const;

export const CHAT_MAX_OUTPUT_TOKENS = 320;
export const CHAT_MAX_MESSAGE_CHARS = 500;
export const CHAT_MAX_MESSAGES = 8;
export const CHAT_MAX_USER_TURNS = 4;
export const CHAT_RATE_LIMIT = 10;
export const CHAT_RATE_WINDOW_MS = 10 * 60 * 1000;
export const CHAT_BODY_CHARS = 20_000;
