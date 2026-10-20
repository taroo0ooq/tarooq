import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { absoluteUrl } from "../lib/site-url.mjs";

const token = process.env.LINKEDIN_ACCESS_TOKEN || "";
const personId = process.env.LINKEDIN_PERSON_ID || "";
const version = process.env.LINKEDIN_VERSION || "202609";
const postsDir = path.join(process.cwd(), "content", "posts");
const publicDir = path.join(process.cwd(), "public");
const imageByteLimit = 10 * 1024 * 1024;
const imageTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

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

function redact(value, secret = token) {
  return secret ? String(value).split(secret).join("[redacted]") : String(value);
}

function personUrn(id) {
  return id.startsWith("urn:") ? id : `urn:li:person:${id}`;
}

function takeBlock(lines, index) {
  const collected = [];
  let indent = "";
  while (index + 1 < lines.length) {
    const next = lines[index + 1];
    if (next.trim() === "") {
      index += 1;
      collected.push("");
      continue;
    }
    const indentMatch = /^( +|\t+)/.exec(next);
    if (!indentMatch) break;
    if (!indent) indent = indentMatch[1];
    if (!next.startsWith(indent)) break;
    index += 1;
    collected.push(next.slice(indent.length));
  }
  return { value: collected.join("\n").trim(), index };
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
      const blockValue = takeBlock(lines, index);
      index = blockValue.index;
      data[match[1]] = blockValue.value;
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

function resolvePublicImage(image) {
  const value = String(image || "").trim();
  if (!value.startsWith("/") || value.includes("\\") || value.includes("\0")) {
    throw new Error("image must be a site path starting with /.");
  }
  const relative = value.slice(1);
  const parts = relative.split("/");
  if (!relative || parts.some((part) => part === "" || part === "." || part === "..")) {
    throw new Error("image path is not inside public/.");
  }
  const full = path.resolve(publicDir, relative);
  if (full !== publicDir && !full.startsWith(publicDir + path.sep)) {
    throw new Error("image path is not inside public/.");
  }
  return full;
}

function imageFile(image) {
  const full = resolvePublicImage(image);
  if (!existsSync(full)) throw new Error(`Image not found: ${image}`);
  const ext = path.extname(full).toLowerCase();
  if (!imageTypes[ext]) throw new Error(`Unsupported image type ${ext || "(none)"}. Use PNG, JPEG, or GIF.`);
  const size = statSync(full).size;
  if (size > imageByteLimit) {
    throw new Error(`Image is ${size} bytes. LinkedIn accepts images up to 10 MB.`);
  }
  return full;
}

function assertCommentary(commentary, source, hasImage) {
  if (!commentary) throw new Error("linkedinText is empty.");
  if (commentary.length > 3000) throw new Error(`linkedinText is ${commentary.length} characters. The limit is 3000.`);
  if (hasImage && !commentary.includes(source)) {
    throw new Error(`linkedinText must include ${source} when the post has an image.`);
  }
}

function buildPost({ author, commentary, title, description, source, imageUrn, imageAlt }) {
  const content = imageUrn
    ? {
        media: {
          id: imageUrn,
          ...(imageAlt ? { altText: imageAlt.slice(0, 4086) } : {}),
        },
      }
    : {
        article: {
          source,
          title,
          description: (description || title).slice(0, 400),
        },
      };
  return {
    author,
    commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
    content,
  };
}

function apiHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    "Linkedin-Version": version,
    "X-Restli-Protocol-Version": "2.0.0",
    ...extra,
  };
}

function assertUploadUrl(uploadUrl) {
  let url;
  try {
    url = new URL(uploadUrl);
  } catch {
    throw new Error("LinkedIn image initialize returned an invalid upload URL.");
  }
  const host = url.hostname;
  const allowed = host === "linkedin.com" || host.endsWith(".linkedin.com") || host.endsWith(".licdn.com");
  if (url.protocol !== "https:" || !allowed) {
    throw new Error("LinkedIn image initialize returned an unexpected upload URL.");
  }
}

async function uploadLinkedInImage(imagePath, owner) {
  const init = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: apiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ initializeUploadRequest: { owner } }),
  });
  const initText = await init.text();
  if (!init.ok) {
    throw new Error(`LinkedIn image initialize returned ${init.status}: ${redact(initText).slice(0, 500)}`);
  }
  let payload;
  try {
    payload = JSON.parse(initText);
  } catch {
    throw new Error(`LinkedIn image initialize returned invalid JSON: ${redact(initText).slice(0, 500)}`);
  }
  const uploadUrl = payload?.value?.uploadUrl;
  const imageUrn = payload?.value?.image;
  if (typeof uploadUrl !== "string" || !uploadUrl || typeof imageUrn !== "string" || !imageUrn.startsWith("urn:li:image:")) {
    throw new Error("LinkedIn image initialize did not return an upload URL and image URN.");
  }
  assertUploadUrl(uploadUrl);
  const uploaded = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
    },
    body: readFileSync(imagePath),
  });
  if (!uploaded.ok) {
    const body = await uploaded.text();
    throw new Error(`LinkedIn image upload returned ${uploaded.status}: ${redact(body).slice(0, 500)}`);
  }
  return imageUrn;
}

async function publishFile(fileName) {
  const fullPath = path.join(postsDir, fileName);
  const raw = readFileSync(fullPath, "utf8");
  const data = parseFrontmatter(raw);
  if (data.linkedinStatus !== "ready" || data.linkedinUrn) return false;
  const slug = fileName.slice(0, -4);
  const commentary = (data.linkedinText || "").trim();
  const source = absoluteUrl(`/posts/${slug}`);
  const image = (data.image || "").trim();
  const imageAlt = (data.imageAlt || "").trim();
  if (!data.title) throw new Error("Missing title.");
  assertCommentary(commentary, source, Boolean(image));

  let imageUrn = "";
  if (image) {
    imageUrn = await uploadLinkedInImage(imageFile(image), personUrn(personId));
  }

  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: apiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(buildPost({
      author: personUrn(personId),
      commentary,
      title: data.title,
      description: data.description || "",
      source,
      imageUrn,
      imageAlt,
    })),
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
  const source = absoluteUrl("/posts/2026-10-12-cloud");
  const raw = `---
title: "Cloud is a regional capability"
date: 2026-10-12
description: "One sentence."
image: "/posts/example.png"
imageAlt: "Containers at the center of a cloud platform"
lang: ar
linkedinStatus: ready
linkedinUrn: ""
linkedinUrl: ""
linkedinText: |
  Hello

  ${source}
---

Body
`;
  const data = parseFrontmatter(raw);
  if (data.linkedinStatus !== "ready") throw new Error("status");
  if (data.linkedinUrn !== "") throw new Error("urn");
  if (data.image !== "/posts/example.png") throw new Error("image");
  if (data.imageAlt !== "Containers at the center of a cloud platform") throw new Error("imageAlt");
  if (data.lang !== "ar") throw new Error("lang");
  if (data.linkedinText !== `Hello\n\n${source}`) throw new Error("text");
  const resolved = resolvePublicImage(data.image);
  if (!resolved.endsWith(`${path.sep}public${path.sep}posts${path.sep}example.png`)) throw new Error("resolve");
  for (const bad of ["posts/example.png", "../etc/passwd", "/../etc/passwd", "/posts/../../etc/passwd", "https://evil.example/a.png"]) {
    try {
      resolvePublicImage(bad);
      throw new Error(`accepted ${bad}`);
    } catch (error) {
      if (String(error.message || error).startsWith("accepted ")) throw error;
    }
  }
  assertCommentary(data.linkedinText, source, true);
  let rejected = false;
  try {
    assertCommentary("No link here", source, true);
  } catch (error) {
    rejected = String(error.message || error).includes(source);
  }
  if (!rejected) throw new Error("image post without url was accepted");
  assertCommentary("No link here", source, false);

  const imagePost = buildPost({
    author: "urn:li:person:1",
    commentary: data.linkedinText,
    title: data.title,
    description: data.description,
    source,
    imageUrn: "urn:li:image:abc",
    imageAlt: data.imageAlt,
  });
  if (imagePost.content.media?.id !== "urn:li:image:abc") throw new Error("media id");
  if (imagePost.content.media?.altText !== data.imageAlt) throw new Error("media alt");
  if (imagePost.content.article) throw new Error("image post included an article");
  if (!imagePost.commentary.includes(source)) throw new Error("commentary url");

  const articlePost = buildPost({
    author: "urn:li:person:1",
    commentary: "Hello",
    title: data.title,
    description: data.description,
    source,
    imageUrn: "",
    imageAlt: "",
  });
  if (articlePost.content.article?.source !== source) throw new Error("article source");
  if (articlePost.content.article?.title !== data.title) throw new Error("article title");
  if (articlePost.content.article?.description !== "One sentence.") throw new Error("article description");
  if (articlePost.content.media) throw new Error("article post included media");

  let next = setScalar(raw, "linkedinStatus", "posted");
  next = setScalar(next, "linkedinUrn", "urn:li:share:1");
  next = setScalar(next, "linkedinUrl", "https://www.linkedin.com/feed/update/urn:li:share:1");
  const again = parseFrontmatter(next);
  if (again.linkedinStatus !== "posted" || again.linkedinUrn !== "urn:li:share:1") {
    throw new Error("rewrite failed");
  }
  if (again.linkedinText !== data.linkedinText) throw new Error("text lost");
  if (again.image !== data.image || again.imageAlt !== data.imageAlt || again.lang !== "ar") {
    throw new Error("image fields lost");
  }
  const hold = parseFrontmatter(raw.replace("linkedinStatus: ready", "linkedinStatus: hold"));
  if (hold.linkedinStatus !== "hold") throw new Error("hold");
  const plain = parseFrontmatter(raw.replace(/\nimage:.*\nimageAlt:.*\nlang: ar\n/, "\n"));
  if (plain.image || plain.imageAlt || plain.lang) throw new Error("optional image fields");
  if (redact("Bearer abc-token", "abc-token") !== "Bearer [redacted]") throw new Error("redact");
  console.log("self-check ok");
}

if (process.argv.includes("--self-check")) selfCheck();
else await main();
