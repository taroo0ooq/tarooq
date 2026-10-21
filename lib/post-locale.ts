import { localizePath, type Locale } from "./locale";

export function postLanguage(lang: string): Locale {
  return lang === "ar" ? "ar" : "en";
}

export function postCanonicalPath(slug: string, lang: string) {
  return localizePath(`/posts/${slug}`, postLanguage(lang));
}

export function postRedirectPath(slug: string, lang: string, requested: Locale) {
  const canonical = postCanonicalPath(slug, lang);
  const current = localizePath(`/posts/${slug}`, requested);
  return canonical === current ? null : canonical;
}
