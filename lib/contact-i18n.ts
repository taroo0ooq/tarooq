import type { Locale } from "./locale";

export type ContactErrorCatalog = {
  company: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  delivery: string;
  unconfigured: string;
  json: string;
};

const apiErrors: Record<string, keyof ContactErrorCatalog> = {
  "Keep the company name under 120 characters.": "company",
  "Use a name between 2 and 80 characters.": "name",
  "Use a real email address so a reply can land.": "email",
  "Keep the topic under 120 characters.": "topic",
  "Write at least a sentence, under 4000 characters.": "message",
  "The note could not be delivered. Try again later.": "delivery",
  "The mailbox is not ready to receive notes yet. Try again later.": "unconfigured",
  "Send JSON.": "json",
};

export function translateContactError(
  message: string | undefined,
  catalog: ContactErrorCatalog,
  fallback: string,
  locale: Locale,
) {
  if (!message) return fallback;
  const key = apiErrors[message];
  if (!key) return locale === "ar" ? fallback : message;
  return catalog[key];
}
