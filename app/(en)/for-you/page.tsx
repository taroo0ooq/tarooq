import type { Metadata } from "next";
import { ForYouPage } from "@/components/pages/ForYouPage";
import { getCopy } from "@/lib/copy";
import { pageMetadata } from "@/lib/site";

const copy = getCopy("en");

export const metadata: Metadata = pageMetadata("/for-you", {
  title: copy.ui.meta.forYouTitle,
  description: copy.ui.meta.forYouDescription,
});

export default function Page() {
  return <ForYouPage locale="en" />;
}
