import { loadMdxPosts } from "../lib/mdx-import.ts";

const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_SECRET_KEY || "";

function headers(extra = {}) {
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
    ...extra,
  };
}

async function main() {
  if (!url || !key) {
    console.error("Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
    process.exitCode = 1;
    return;
  }
  if (key.startsWith("sb_publishable_")) {
    console.error("SUPABASE_SECRET_KEY must be the server secret key.");
    process.exitCode = 1;
    return;
  }
  const posts = loadMdxPosts();
  console.log(`Importing ${posts.length} post${posts.length === 1 ? "" : "s"}. Images stay in public/posts.`);
  for (const post of posts) {
    const response = await fetch(`${url}/rest/v1/posts?on_conflict=slug`, {
      method: "POST",
      headers: headers({ prefer: "resolution=ignore-duplicates,return=representation" }),
      body: JSON.stringify(post),
    });
    const text = await response.text();
    if (!response.ok) {
      console.error(`${post.slug}: ${response.status} ${text.slice(0, 300)}`);
      process.exitCode = 1;
      continue;
    }
    const rows = text ? JSON.parse(text) : [];
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      console.log(`${post.slug}: already present, left unchanged`);
      continue;
    }
    console.log(`${post.slug}: inserted`);
    if (post.linkedin_urn) {
      const claim = await fetch(`${url}/rest/v1/rpc/finish_linkedin_publish`, {
        method: "POST",
        headers: headers({ prefer: "return=minimal" }),
        body: JSON.stringify({ p_post_id: row.id, p_urn: post.linkedin_urn, p_url: post.linkedin_url }),
      });
      if (!claim.ok) {
        const detail = await claim.text();
        console.error(`${post.slug}: claim ${claim.status} ${detail.slice(0, 300)}`);
        process.exitCode = 1;
      }
    }
  }
}

const entry = process.argv[1] || "";
if (entry.endsWith("import-posts.mjs")) main();
