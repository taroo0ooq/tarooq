const beaconHost = "https://static.cloudflareinsights.com/beacon.min.js";

/** Public beacon address. The token stays out of the page unless production asked for it. */
export function cloudflareBeaconScript() {
  return beaconHost;
}

/**
 * The beacon token is public, but it is set on Vercel Production only.
 * VERCEL_ENV is a server variable, so this check has to run while rendering the layout.
 */
export function cloudflareBeaconToken() {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN?.trim() || "";
  if (!token || process.env.VERCEL_ENV !== "production") return "";
  return token;
}

export function cloudflareBeaconAttribute(token: string) {
  return JSON.stringify({ token });
}
