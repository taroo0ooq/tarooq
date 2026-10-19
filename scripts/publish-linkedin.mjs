import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const token = process.env.LINKEDIN_ACCESS_TOKEN || "";
const personId = process.env.LINKEDIN_PERSON_ID || "";
const version = process.env.LINKEDIN_VERSION || "202609";
const postsDir = path.join(process.cwd(), "content", "posts");

function unquote(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === "string" ? parsed : trimmed;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function redact(value) {
  return token ? String(value).split(token).join("[redacted]") : String(value);
}

function personUrn(id) {
  return id.startsWith("urn:") ? id : `urn:li:person:${id}`;
}

function parseFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, "");
  if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) return {};
  const end = text.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = text.slice(text.indexOf("\n") + 1, end);
  const data = {};
  const lines = block.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^([A-Za-z0-9]+):\s*(.*)$/.exec(lines[index]);
    if (!match) continue;
    if (match[2] === "|") {
      const collected = [];
      while (index + 1 < lines.length && /^( {2}|\t)/.test(lines[index + 1])) {
        index += 1;
        collected.push(lines[index].replace(/^(?: {2}|\t)/, ""));
      }
      data[match[1]] = collected.join("\n").trim();
    } else {
      data[match[1]] = unquote(match[2]);
    }
  }
  return data;
}

function setScalar(raw, key, value) {
  const pattern = new RegExp(`^(${key}:).*$`, "m");
  if (!pattern.test(raw)) throw new Error(`Missing ${key} in frontmatter.`);
  return raw.replace(pattern, `$1 ${JSON.stringify(value)}`);
}

async function publishFile(fileName) {
  const fullPath = path.join(postsDir, fileName);
  const raw = readFileSync(fullPath, "utf8");
  const data = parseFrontmatter(raw);
  if (data.linkedinStatus !== "ready" || data.linkedinUrn) return false;
  const slug = fileName.slice(0, -4);
  const commentary = (data.linkedinText || "").trim();
  if (!commentary) throw new Error("linkedinText is empty.");
  if (commentary.length > 3000) throw new Error(`linkedinText is ${commentary.length} characters. The limit is 3000.`);
  if (!data.title) throw new Error("Missing title.");

  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Linkedin-Version": version,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: personUrn(personId),
      commentary,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
      content: {
        article: {
          source: `https://tarooq.vercel.app/posts/${slug}`,
          title: data.title,
          description: (data.description || data.title).slice(0, 400),
        },
      },
    }),
  });

  if (response.status !== 201) {
    const body = await response.text();
    throw new Error(`LinkedIn returned ${response.status}: ${redact(body).slice(0, 500)}`);
  }

  const urn = response.headers.get("x-restli-id") || "";
  if (!urn.startsWith("urn:")) throw new Error("LinkedIn did not return a post URN.");
  const url = `https://www.linkedin.com/feed/update/${urn}`;
  let next = setScalar(raw, "linkedinStatus", "posted");
  next = setScalar(next, "linkedinUrn", urn);
  next = setScalar(next, "linkedinUrl", url);
  writeFileSync(fullPath, next);
  console.log(`Posted ${slug} ${urn}`);
  return true;
}

async function main() {
  if (!token || !personId) {
    console.log("Skipping LinkedIn publish: LINKEDIN_ACCESS_TOKEN or LINKEDIN_PERSON_ID is not set.");
    return;
  }
  let names = [];
  try {
    names = readdirSync(postsDir).filter((name) => name.endsWith(".mdx"));
  } catch {
    console.log("No content/posts directory.");
    return;
  }
  const errors = [];
  for (const name of names) {
    try {
      await publishFile(name);
    } catch (error) {
      errors.push(`${name}: ${redact(error instanceof Error ? error.message : error)}`);
    }
  }
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  }
}

function selfCheck() {
  const raw = `---
title: "Cloud is a regional capability"
date: 2026-10-12
description: "One sentence."
linkedinStatus: ready
linkedinUrn: ""
linkedinUrl: ""
linkedinText: |
  Hello
  https://tarooq.vercel.app/posts/2026-10-12-cloud
---

Body
`;
  const data = parseFrontmatter(raw);
  if (data.linkedinStatus !== "ready") throw new Error("status");
  if (data.linkedinUrn !== "") throw new Error("urn");
  if (!data.linkedinText.includes("Hello")) throw new Error("text");
  let next = setScalar(raw, "linkedinStatus", "posted");
  next = setScalar(next, "linkedinUrn", "urn:li:share:1");
  next = setScalar(next, "linkedinUrl", "https://www.linkedin.com/feed/update/urn:li:share:1");
  const again = parseFrontmatter(next);
  if (again.linkedinStatus !== "posted" || again.linkedinUrn !== "urn:li:share:1") {
    throw new Error("rewrite failed");
  }
  if (!again.linkedinText.includes("Hello")) throw new Error("text lost");
  const hold = parseFrontmatter(raw.replace("linkedinStatus: ready", "linkedinStatus: hold"));
  if (hold.linkedinStatus !== "hold") throw new Error("hold");
  console.log("self-check ok");
}

if (process.argv.includes("--self-check")) selfCheck();
else await main();
