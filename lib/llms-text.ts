import { readFileSync } from "node:fs";
import path from "node:path";
import { postCanonicalPath } from "./post-locale";
import { absoluteUrl } from "./site";

const file = path.join(process.cwd(), "content/llms.txt");

export type LlmsPost = {
  title: string;
  slug: string;
  lang: string;
  date?: string;
};

export function llmsTemplate() {
  return readFileSync(file, "utf8");
}

export function formatLlmsPosts(posts: LlmsPost[]) {
  return [...posts]
    .sort((a, b) => (b.date ?? b.slug).localeCompare(a.date ?? a.slug) || b.slug.localeCompare(a.slug))
    .map((post) => {
      const language = post.lang === "ar" ? "Arabic" : "English";
      const url = absoluteUrl(postCanonicalPath(post.slug, post.lang));
      return `- [${post.title}](${url}) (${language}).`;
    })
    .join("\n");
}

export function renderLlms(posts: LlmsPost[]) {
  const postsBlock = formatLlmsPosts(posts);
  return llmsTemplate().replace("{{posts}}", postsBlock);
}

export function llmsResponse(posts: LlmsPost[]) {
  return new Response(renderLlms(posts), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
