const DEFAULT_SITE_URL = "https://alghazzi.org";

function fallbackOrigin() {
  return DEFAULT_SITE_URL;
}

/** Absolute origin for the site. Override with NEXT_PUBLIC_SITE_URL. */
export function resolveSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL) {
  const raw = (value ?? "").trim();
  if (!raw) return fallbackOrigin();
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallbackOrigin();
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (!local && url.protocol === "http:") url.protocol = "https:";
    if (url.hostname === "www.alghazzi.org") url.hostname = "alghazzi.org";
    return url.origin;
  } catch {
    return fallbackOrigin();
  }
}

export function absoluteUrl(path = "/", base = resolveSiteUrl()) {
  if (!path || path === "/") return base;
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  const trimmed = withSlash.length > 1 && withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
  return `${base}${trimmed}`;
}

export const siteUrl = resolveSiteUrl();
