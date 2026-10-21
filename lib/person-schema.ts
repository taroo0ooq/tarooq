import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const personId = "https://alghazzi.org/#person";

type ProfilePageLd = {
  "@context": string;
  "@type": string;
  "@id": string;
  url: string;
  name: string;
  inLanguage: string;
  mainEntity: {
    "@type": string;
    "@id": string;
    name: string;
    alternateName: string[];
    url: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const englishProfileSource = require("../content/person-jsonld.json") as ProfilePageLd;

export function profilePageFor(locale: "en" | "ar"): ProfilePageLd {
  const page = structuredClone(englishProfileSource);
  if (locale === "en") return page;
  const englishName = page.mainEntity.name;
  const alternates = page.mainEntity.alternateName.filter((name) => name !== "طارق الغزي" && name !== englishName);
  page["@id"] = "https://alghazzi.org/ar#profilepage";
  page.url = "https://alghazzi.org/ar";
  page.inLanguage = "ar";
  page.name = "طارق الغزي | رئيس خدمات السحابة، الشرق الأوسط وشمال أفريقيا";
  page.mainEntity.name = "طارق الغزي";
  page.mainEntity.alternateName = [englishName, ...alternates];
  return page;
}

export function personReference() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personId,
  };
}
