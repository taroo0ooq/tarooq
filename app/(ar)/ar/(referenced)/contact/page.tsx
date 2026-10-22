import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/ContactPage";
import { getCopy } from "@/lib/copy";
import { pageMetadata } from "@/lib/site";

const copy = getCopy("ar");

export const metadata: Metadata = pageMetadata("/ar/contact", {
  title: copy.ui.meta.contactTitle,
  description: copy.ui.meta.contactDescription,
});

type PageProps = { searchParams: Promise<{ topic?: string }> };

export default async function Page({ searchParams }: PageProps) {
  const { topic } = await searchParams;
  return <ContactPage locale="ar" initialTopic={topic} />;
}
