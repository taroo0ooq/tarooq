export const locales = ["en", "ar"] as const;

export type Locale = (typeof locales)[number];

export function cleanPath(pathname: string) {
  const cut = pathname.split(/[?#]/)[0] ?? "/";
  if (!cut) return "/";
  const withSlash = cut.startsWith("/") ? cut : `/${cut}`;
  if (withSlash.length > 1 && withSlash.endsWith("/")) return withSlash.slice(0, -1);
  return withSlash || "/";
}

export function isArabicPath(pathname: string) {
  const path = cleanPath(pathname);
  return path === "/ar" || path.startsWith("/ar/");
}

export function stripLocale(pathname: string) {
  const path = cleanPath(pathname);
  if (path === "/ar") return "/";
  if (path.startsWith("/ar/")) return path.slice(3) || "/";
  return path;
}

export function localizePath(pathname: string, locale: Locale) {
  const bare = stripLocale(pathname);
  if (locale === "en") return bare;
  return bare === "/" ? "/ar" : `/ar${bare}`;
}

const englishOnlyPrefixes = ["/posts/new", "/api", "/linkedin"];

export function isPostArticlePath(pathname: string) {
  const path = stripLocale(cleanPath(pathname));
  return /^\/posts\/[^/]+$/.test(path) && path !== "/posts/new";
}

export function isEnglishOnlyPath(pathname: string) {
  const path = cleanPath(pathname);
  return englishOnlyPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export type LanguageSwitch = {
  href: string;
  hrefLang: Locale;
  label: string;
  ariaLabel: string;
};

export function languageSwitch(pathname: string, hash = ""): LanguageSwitch {
  const embedded = pathname.includes("#") ? pathname.slice(pathname.indexOf("#")) : "";
  const path = cleanPath(pathname);
  const chosen = hash || embedded;
  const normalizedHash = chosen ? (chosen.startsWith("#") ? chosen : `#${chosen}`) : "";
  if (!isArabicPath(path) && isEnglishOnlyPath(path)) {
    return {
      href: "/ar",
      hrefLang: "ar",
      label: "العربية",
      ariaLabel: "عرض الموقع بالعربية",
    };
  }
  if (isPostArticlePath(path)) {
    const toArabic = !isArabicPath(path);
    const href = localizePath("/posts", toArabic ? "ar" : "en");
    if (toArabic) {
      return { href, hrefLang: "ar", label: "العربية", ariaLabel: "عرض الموقع بالعربية" };
    }
    return { href, hrefLang: "en", label: "English", ariaLabel: "التبديل إلى الإنجليزية" };
  }
  const toArabic = !isArabicPath(path);
  const href = `${localizePath(path, toArabic ? "ar" : "en")}${normalizedHash}`;
  if (toArabic) {
    return { href, hrefLang: "ar", label: "العربية", ariaLabel: "عرض الموقع بالعربية" };
  }
  return { href, hrefLang: "en", label: "English", ariaLabel: "التبديل إلى الإنجليزية" };
}

export function alternatePaths(pathname: string) {
  const bare = stripLocale(pathname);
  return {
    en: bare,
    ar: localizePath(bare, "ar"),
    "x-default": bare,
  };
}
