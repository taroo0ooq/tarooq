import Script from "next/script";
import { cloudflareBeaconAttribute, cloudflareBeaconScript, cloudflareBeaconToken } from "@/lib/cloudflare-beacon";

/** Cookieless page-view counter. Rendered only on the production build. */
export function CloudflareBeacon() {
  const token = cloudflareBeaconToken();
  if (!token) return null;
  return (
    <Script
      id="cf-beacon"
      src={cloudflareBeaconScript()}
      strategy="lazyOnload"
      defer
      data-cf-beacon={cloudflareBeaconAttribute(token)}
    />
  );
}
