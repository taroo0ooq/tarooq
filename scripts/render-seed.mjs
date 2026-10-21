import { writeFileSync } from "node:fs";
import path from "node:path";
import { loadMdxPosts, renderSeedSql } from "../lib/mdx-import.ts";

const target = path.join(process.cwd(), "supabase/migrations/20261021120100_posts_seed.sql");
const sql = `${renderSeedSql(loadMdxPosts()).trim()}\n`;
writeFileSync(target, sql);
console.log(`Wrote ${target}`);
