import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/ContactPage";
import { getCopy } from "@/lib/copy";
import { pageMetadata } from "@/lib/site";

const copy = getCopy("en");

export const metadata: Metadata = pageMetadata("/contact", {
  title: copy.ui.meta.contactTitle,
  description: copy.ui.meta.contactDescription,
});

export default function Page() {
  return <ContactPage locale="en" />;
}
