import { revalidatePath, revalidateTag } from "next/cache";
import { POSTS_CACHE_TAG } from "./cache-tags";

export function revalidatePosts(slugs: string[]) {
  revalidateTag(POSTS_CACHE_TAG);
  revalidatePath("/posts");
  revalidatePath("/ar/posts");
  revalidatePath("/sitemap.xml");
  for (const slug of slugs) {
    revalidatePath(`/posts/${slug}`);
    revalidatePath(`/ar/posts/${slug}`);
  }
}
