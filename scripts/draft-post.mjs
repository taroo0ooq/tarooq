import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { absoluteUrl } from "../lib/site-url.mjs";
import { riyadhDate } from "../lib/post-draft.ts";
import {
  assertDailyDraftSecrets,
  createDailyDraftClient,
  dailyDraftKey,
  formatDailyDraftFailure,
  messageText,
  missingDailyDraftConfig,
  missingDailyDraftMessage,
  normalizeGeneratedDraft,
  parseModelJson,
  saveDailyDraft,
} from "../lib/daily-draft.ts";

// Creates one Supabase draft for the Riyadh day.
// Never publishes, never calls LinkedIn, and never writes a repo file.

function titles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => {
      const raw = readFileSync(path.join(dir, name), "utf8");
      return /^title:\s*"?(.*?)"?\s*$/m.exec(raw)?.[1] ?? name;
    });
}

function fail(message) {
  console.error(message);
  if (process.env.GITHUB_ACTIONS === "true") {
    console.error(`::error::${message.replace(/\s+/g, " ").trim()}`);
  }
  process.exitCode = 1;
}

function secretValues() {
  return [process.env.SUPABASE_SECRET_KEY || "", process.env.XAI_API_KEY || "", process.env.AI_GATEWAY_API_KEY || ""];
}

async function generateDraft(voice, knownTitles, date) {
  const gatewayKey = (process.env.AI_GATEWAY_API_KEY || "").trim();
  const xaiKey = (process.env.XAI_API_KEY || "").trim();
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
            "The draft is reviewed before it is published, so write linkedinText as the finished post.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Voice guide:\n${voice}\n\nAlready used titles:\n${knownTitles.join("\n") || "(none)"}\n\nToday is ${date}. The article URL is ${absoluteUrl(`/posts/${date}-SLUG`)}. Replace SLUG with your slug.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Model request failed (${response.status}): ${body.slice(0, 400)}`);
  }
  return normalizeGeneratedDraft(parseModelJson(messageText(await response.json())), {
    date,
    articleUrl: (fullSlug) => absoluteUrl(`/posts/${fullSlug}`),
  });
}

async function main() {
  const missing = missingDailyDraftConfig(process.env);
  if (missing.length > 0) {
    fail(missingDailyDraftMessage(missing));
    return;
  }

  try {
    const desk = assertDailyDraftSecrets(process.env);
    const date = riyadhDate();
    const client = createDailyDraftClient({ url: desk.url, key: desk.key });
    const existing = await client.findByKey(dailyDraftKey(date));
    if (existing) {
      console.log(`Draft for ${date} already exists (${existing.slug}, ${existing.status}). Leaving it unchanged.`);
      return;
    }

    const voicePath = path.join(process.cwd(), "content", "voice.md");
    if (!existsSync(voicePath)) throw new Error("content/voice.md is missing, so the draft was not created.");
    const posts = await client.listPosts();
    const knownTitles = [...new Set(
      [...titles(path.join(process.cwd(), "content", "posts")), ...posts.map((post) => post.title)]
        .map((title) => title.trim())
        .filter(Boolean),
    )];
    const generated = await generateDraft(readFileSync(voicePath, "utf8"), knownTitles, date);
    const saved = await saveDailyDraft(client, {
      date,
      title: generated.title,
      description: generated.description,
      body: generated.body,
      linkedinText: generated.linkedinText,
      preferredSlug: generated.preferredSlug,
      existingSlugs: posts.map((post) => post.slug),
      articleUrl: (fullSlug) => absoluteUrl(`/posts/${fullSlug}`),
    });
    if (saved.action === "exists") {
      console.log(`Draft for ${date} already exists (${saved.slug}, ${saved.status}). Leaving it unchanged.`);
      return;
    }
    console.log(`Created draft ${saved.slug} for ${date}. It is in the desk as a draft. Nothing was published.`);
  } catch (error) {
    fail(formatDailyDraftFailure(error, secretValues()));
  }
}

const entry = process.argv[1] || "";
if (entry.endsWith("draft-post.mjs")) {
  main().catch((error) => {
    fail(formatDailyDraftFailure(error, secretValues()));
  });
}
