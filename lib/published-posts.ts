import { unstable_cache } from "next/cache";
import { POSTS_CACHE_TAG } from "./cache-tags";
import { promoteDuePosts, type ActionContext } from "./owner-actions";
import { readPublishedPosts } from "./post-source";
import { getPosts } from "./posts";
import { siteUrl } from "./site-url.mjs";
import { postsDbFromEnv } from "./supabase-posts";

function context(now = new Date()): ActionContext {
  return { now, origin: siteUrl, supabaseUrl: process.env.SUPABASE_URL || "" };
}

async function readFreshPosts(now = new Date()) {
  const db = postsDbFromEnv();
  if (!db) return getPosts();
  const result = await readPublishedPosts({
    hasAny: () => db.hasAny(),
    list: () => db.list(),
    now,
    supabaseUrl: process.env.SUPABASE_URL || "",
  });
  return result.posts;
}

const cachedPosts = unstable_cache(
  async () => readFreshPosts(),
  ["published-posts-v1"],
  { tags: [POSTS_CACHE_TAG], revalidate: 10 },
);

export async function getPublishedPosts() {
  return cachedPosts();
}

export async function getPublishedPost(slug: string) {
  const posts = await getPublishedPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function warmDuePosts() {
  if (process.env.NEXT_PHASE === "phase-production-build") return [];
  const db = postsDbFromEnv();
  if (!db) return [];
  return promoteDuePosts(db, context());
}

export async function loadPublicPosts() {
  const now = new Date();
  let changed: string[] = [];
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    try {
      const db = postsDbFromEnv();
      if (db) changed = await promoteDuePosts(db, context(now));
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
  }
  if (changed.length > 0) return readFreshPosts(now);
  return getPublishedPosts();
}
