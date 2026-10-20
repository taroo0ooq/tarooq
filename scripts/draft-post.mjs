import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { absoluteUrl } from "../lib/site-url.mjs";

const gatewayKey = process.env.AI_GATEWAY_API_KEY || "";
const xaiKey = process.env.XAI_API_KEY || "";

function riyadhDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function titles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => {
      const raw = readFileSync(path.join(dir, name), "utf8");
      return /^title:\s*"?(.*?)"?\s*$/m.exec(raw)?.[1] ?? name;
    });
}

function messageText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part === "string" ? part : part?.text || "")).join("");
  }
  throw new Error("The model response had no text.");
}

function parseModelJson(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end < start) throw new Error("The model did not return JSON.");
  return JSON.parse(trimmed.slice(start, end + 1));
}

function yamlBlock(value) {
  return String(value)
    .replace(/\r\n/g, "\n")
    .trim()
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

async function main() {
  if (!gatewayKey && !xaiKey) {
    console.log("Skipping draft: no XAI_API_KEY or AI_GATEWAY_API_KEY.");
    return;
  }

  const voicePath = path.join(process.cwd(), "content", "voice.md");
  const postsDir = path.join(process.cwd(), "content", "posts");
  const voice = readFileSync(voicePath, "utf8");
  const date = riyadhDate();
  const known = titles(postsDir);
  const key = gatewayKey || xaiKey;
  const base = gatewayKey ? "https://ai-gateway.vercel.sh/v1" : "https://api.x.ai/v1";
  const override = process.env.XAI_MODEL || "";
  let model = override || (gatewayKey ? "xai/grok-4.7" : "grok-4.7");
  if (gatewayKey && !model.includes("/")) model = `xai/${model}`;

  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: [
            "You are the Linkedin Content Creator for Tareq Al-Ghazzi.",
            "Return one JSON object and nothing else.",
            "Keys: title, slug, description, linkedinText, bodyMarkdown.",
            "Write in the first person, as Tareq.",
            "Use only the facts in the voice guide. Do not invent metrics, client names, awards, revenue, team sizes, or certifications.",
            "One idea. Do not repeat a title already published.",
            "bodyMarkdown is 400 to 700 words, in short paragraphs. No HTML. No level-1 heading. You may use ##, **bold**, and markdown links.",
            "slug is lowercase letters, numbers, and hyphens, with no date prefix.",
            "description is one sentence under 180 characters.",
            "linkedinText is the LinkedIn commentary, under 1200 characters, and it must include the article URL from the user message.",
            "Do not speak as a company page.",
            "Merging the pull request publishes linkedinText, so write it as the finished post.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Voice guide:\n${voice}\n\nAlready used titles:\n${known.join("\n") || "(none)"}\n\nToday is ${date}. The article URL is ${absoluteUrl(`/posts/${date}-SLUG`)}. Replace SLUG with your slug.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = (await response.text()).split(key).join("[redacted]");
    throw new Error(`Model request failed (${response.status}): ${body.slice(0, 400)}`);
  }

  const draft = parseModelJson(messageText(await response.json()));
  const slug = String(draft.slug || "")
    .trim()
    .toLowerCase()
    .replace(/^\d{4}-\d{2}-\d{2}-/, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 60) {
    throw new Error("The model returned an invalid slug.");
  }
  const title = String(draft.title || "").replace(/\s+/g, " ").trim();
  const description = String(draft.description || "").replace(/\s+/g, " ").trim();
  const bodyMarkdown = String(draft.bodyMarkdown || "").trim();
  let linkedinText = String(draft.linkedinText || "").trim();
  const articleUrl = absoluteUrl(`/posts/${date}-${slug}`);
  if (!title || !description || !bodyMarkdown || !linkedinText) {
    throw new Error("The model JSON is missing a required field.");
  }
  if (bodyMarkdown.split(/\s+/).length < 80) throw new Error("The article is too short to open a pull request.");
  if (!linkedinText.includes(articleUrl)) linkedinText = `${linkedinText}\n\n${articleUrl}`;
  if (linkedinText.length > 1200) throw new Error("linkedinText is longer than 1200 characters.");

  const fileName = `${date}-${slug}.mdx`;
  const fullPath = path.join(postsDir, fileName);
  if (existsSync(fullPath)) {
    console.log(`Skipping draft: ${fileName} already exists.`);
    return;
  }

  const file = `---
title: ${JSON.stringify(title)}
date: ${date}
description: ${JSON.stringify(description)}
linkedinStatus: ready
linkedinUrn: ""
linkedinUrl: ""
linkedinText: |
${yamlBlock(linkedinText)}
---

${bodyMarkdown}
`;
  writeFileSync(fullPath, file);
  console.log(`Wrote content/posts/${fileName}`);

  if (process.env.GITHUB_ACTIONS !== "true") {
    console.log("Draft file written. The pull request step runs in GitHub Actions.");
    return;
  }

  const branch = `post/${date}-${slug}`;
  const relative = `content/posts/${fileName}`;
  execFileSync("git", ["config", "user.name", "github-actions[bot]"], { stdio: "inherit" });
  execFileSync("git", ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"], { stdio: "inherit" });
  execFileSync("git", ["checkout", "-b", branch], { stdio: "inherit" });
  execFileSync("git", ["add", "--", relative], { stdio: "inherit" });
  execFileSync("git", ["commit", "-m", `Post: ${title.replace(/\r?\n/g, " ").slice(0, 120)}`], { stdio: "inherit" });
  execFileSync("git", ["push", "-u", "origin", branch], { stdio: "inherit" });
  execFileSync(
    "gh",
    [
      "pr",
      "create",
      "--title",
      `Post: ${title.replace(/\r?\n/g, " ").slice(0, 120)}`,
      "--body",
      "Merging this pull request publishes the LinkedIn text if LINKEDIN_ACCESS_TOKEN is set. Review the article and the linkedinText before merging.",
    ],
    { stdio: "inherit" },
  );
}

await main();
