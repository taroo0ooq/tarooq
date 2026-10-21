import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/ContactPage";
import { getCopy } from "@/lib/copy";
import { pageMetadata } from "@/lib/site";

const copy = getCopy("ar");

export const metadata: Metadata = pageMetadata("/ar/contact", {
  title: copy.ui.meta.contactTitle,
  description: copy.ui.meta.contactDescription,
});

export default function Page() {
  return <ContactPage locale="ar" />;
}
