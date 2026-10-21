import { getPosts, type PostMeta } from "./posts";
import type { PostRow } from "./post-types";
import { comparePosts, isPublicPost, rowToMeta } from "./post-view";

export async function readPublishedPosts(deps: {
  hasAny: () => Promise<boolean>;
  list: () => Promise<PostRow[]>;
  files?: () => PostMeta[];
  now: Date;
  supabaseUrl: string;
}): Promise<{ source: "supabase" | "files"; posts: PostMeta[] }> {
  const files = deps.files ?? getPosts;
  try {
    const any = await deps.hasAny();
    if (!any) return { source: "files", posts: files() };
    const rows = await deps.list();
    const posts = rows
      .filter((row) => isPublicPost(row, deps.now))
      .map((row) => rowToMeta(row, deps.supabaseUrl))
      .sort(comparePosts);
    return { source: "supabase", posts };
  } catch {
    return { source: "files", posts: files() };
  }
}
