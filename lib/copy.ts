import * as ar from "./content.ar";
import * as en from "./content";
import type { Locale } from "./locale";

export function getCopy(locale: Locale) {
  return locale === "ar" ? ar : en;
}

export function fillSite(template: string, site: string) {
  return template.replaceAll("{{site}}", site);
}
