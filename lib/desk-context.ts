import type { ActionContext } from "./owner-actions";
import { revalidatePosts } from "./revalidate-posts";
import { siteUrl } from "./site-url.mjs";

export function deskContext(now = new Date()): ActionContext {
  return {
    now,
    origin: siteUrl,
    supabaseUrl: process.env.SUPABASE_URL || "",
    onChange: (slugs) => revalidatePosts(slugs),
  };
}
