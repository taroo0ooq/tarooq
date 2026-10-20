import type { Metadata } from "next";
import { PrivacyPage } from "@/components/pages/PrivacyPage";
import { fillSite, getCopy } from "@/lib/copy";
import { pageMetadata, siteUrl } from "@/lib/site";

const copy = getCopy("en");

export const metadata: Metadata = pageMetadata("/privacy", {
  title: copy.ui.meta.privacyTitle,
  description: fillSite(copy.ui.meta.privacyDescription, siteUrl),
});

export default function Page() {
  return <PrivacyPage locale="en" />;
}
