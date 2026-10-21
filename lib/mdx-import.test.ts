import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { loadMdxPosts, renderSeedSql } from "./mdx-import.ts";

describe("content import", () => {
  it("seeds every bundled post without copying image bytes", () => {
    const posts = loadMdxPosts();
    const slugs = posts.map((post) => post.slug).sort();
    assert.deepEqual(slugs, ["2026-10-20-kubernetes-isnt-cloud", "2026-10-21-syrias-digital-systems"]);
    const kubernetes = posts.find((post) => post.slug.startsWith("2026-10-20"));
    const syria = posts.find((post) => post.slug.startsWith("2026-10-21"));
    assert.equal(kubernetes?.lang, "ar");
    assert.equal(kubernetes?.cover_path, "/posts/2026-10-20-kubernetes-isnt-cloud.png");
    assert.equal(kubernetes?.linkedin_urn, "urn:li:share:7518440656445267968");
    assert.equal(syria?.lang, "en");
    assert.equal(syria?.cover_path, "/posts/syrias-digital-systems.png");
    assert.equal(syria?.linkedin_status, "posted");
    const seed = readFileSync("supabase/migrations/20261021120100_posts_seed.sql", "utf8");
    const rendered = renderSeedSql(posts);
    for (const slug of slugs) assert.match(seed, new RegExp(slug));
    assert.match(seed, /on conflict \(slug\) do nothing/);
    assert.match(seed, /on conflict \(post_id\) do nothing/);
    assert.equal(seed.includes("base64"), false);
    assert.match(rendered, /\/posts\/syrias-digital-systems\.png/);
    assert.match(readFileSync("supabase/migrations/20261021120000_posts.sql", "utf8"), /posts_public_read/);
    assert.match(readFileSync("supabase/migrations/20261021120000_posts.sql", "utf8"), /post-images/);
  });

  it("removes GitHub commit publishing and the LinkedIn workflow", () => {
    assert.equal(existsSync(".github/workflows/publish-linkedin.yml"), false);
    assert.equal(existsSync(".github/workflows/linkedin-token-reminder.yml"), false);
    assert.equal(existsSync("scripts/publish-linkedin.mjs"), false);
    assert.equal(existsSync("scripts/commit-dispatch.mjs"), false);
    assert.equal(existsSync("scripts/token-reminder.mjs"), false);
    assert.equal(existsSync("lib/github-contents.ts"), false);
    assert.equal(existsSync("lib/verified-git.ts"), false);
    const source = readFileSync("lib/posts-http.ts", "utf8") + readFileSync("lib/owner-actions.ts", "utf8");
    assert.equal(source.includes("GITHUB_CONTENTS_TOKEN"), false);
    assert.equal(source.includes("github.com"), false);
  });
});
