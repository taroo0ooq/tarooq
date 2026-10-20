import type { Metadata } from "next";
import { BusinessPage } from "@/components/pages/BusinessPage";
import { getCopy } from "@/lib/copy";
import { pageMetadata } from "@/lib/site";

const copy = getCopy("en");

export const metadata: Metadata = pageMetadata("/business", {
  title: copy.ui.meta.businessTitle,
  description: copy.businessPage.audience,
});

export default function Page() {
  return <BusinessPage locale="en" />;
}
