import type { Metadata } from "next";
import { PostsIndex } from "@/components/pages/PostsIndex";
import { getCopy } from "@/lib/copy";
import { pageMetadata } from "@/lib/site";

const copy = getCopy("ar");

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata("/ar/posts", {
  title: copy.ui.meta.postsTitle,
  description: copy.ui.meta.postsDescription,
});

export default function Page() {
  return <PostsIndex locale="ar" />;
}
