import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { absoluteUrl } from "../lib/site-url.mjs";
import { LINKEDIN_RECORD_MESSAGE, decideLinkedIn, isDefiniteLinkedInRejection } from "../lib/publish-plan.ts";
import { ClaimExistsError, createVerifiedGit } from "../lib/verified-git.ts";

const token = process.env.LINKEDIN_ACCESS_TOKEN || "";
const personId = process.env.LINKEDIN_PERSON_ID || "";
const version = process.env.LINKEDIN_VERSION || "202609";

class LinkedInRequestError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "LinkedInRequestError";
    this.status = status;
  }
}
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
    throw new LinkedInRequestError(`LinkedIn image initialize returned ${init.status}: ${redact(initText).slice(0, 500)}`, init.status);
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
    throw new LinkedInRequestError(`LinkedIn image upload returned ${uploaded.status}: ${redact(body).slice(0, 500)}`, uploaded.status);
  }
  return imageUrn;
}

function withIds(raw, urn, url) {
  let next = setScalar(raw, "linkedinStatus", "posted");
  next = setScalar(next, "linkedinUrn", urn);
  next = setScalar(next, "linkedinUrl", url);
  return next;
}

async function releaseClaim(git, slug) {
  try {
    await git.deleteClaim(slug);
  } catch (error) {
    console.error(`Could not release the claim for ${slug}: ${redact(error instanceof Error ? error.message : error)}`);
  }
}

function refusal(slug) {
  return new Error(`a LinkedIn publish already started without recording an id. Refusing to post again. If LinkedIn has no post for it, delete refs/linkedin-claims/${slug} and run this workflow again.`);
}

async function recordOnMain(git, fileName, raw, urn, url) {
  const next = withIds(raw, urn, url);
  try {
    const committed = await git.replaceFile(`content/posts/${fileName}`, Buffer.from(next, "utf8"), LINKEDIN_RECORD_MESSAGE);
    writeFileSync(path.join(postsDir, fileName), next);
    console.log(`Recorded ${fileName} ${urn} ${committed.sha}`);
  } catch (error) {
    throw new Error(`Could not record ${urn} on main. ${redact(error instanceof Error ? error.message : error)}`);
  }
}

async function publishFile(fileName, git) {
  const fullPath = path.join(postsDir, fileName);
  let raw = "";
  if (git) {
    raw = await git.readTextFile(`content/posts/${fileName}`) || "";
  }
  if (!raw) {
    if (!existsSync(fullPath)) return false;
    raw = readFileSync(fullPath, "utf8");
  }
  const data = parseFrontmatter(raw);
  const slug = fileName.slice(0, -4);
  const claim = git ? await git.readClaim(slug) : null;
  const decision = git
    ? decideLinkedIn(data.linkedinStatus || "", data.linkedinUrn || "", claim)
    : (data.linkedinStatus !== "ready" || data.linkedinUrn ? "skip" : "post");
  if (decision === "skip") return false;
  if (decision === "refuse") throw refusal(slug);
  if (decision === "recover") {
    if (claim?.state !== "posted") throw refusal(slug);
    await recordOnMain(git, fileName, raw, claim.urn, claim.url);
    await releaseClaim(git, slug);
    return true;
  }

  const commentary = (data.linkedinText || "").trim();
  const source = absoluteUrl(`/posts/${slug}`);
  const image = (data.image || "").trim();
  const imageAlt = (data.imageAlt || "").trim();
  if (!data.title) throw new Error("Missing title.");
  assertCommentary(commentary, source, Boolean(image));
  if (image) imageFile(image);

  if (git) {
    try {
      await git.createClaim(slug);
    } catch (error) {
      if (!(error instanceof ClaimExistsError)) throw error;
      const again = await git.readClaim(slug);
      const next = decideLinkedIn(data.linkedinStatus || "", data.linkedinUrn || "", again);
      if (next === "recover" && again?.state === "posted") {
        await recordOnMain(git, fileName, raw, again.urn, again.url);
        await releaseClaim(git, slug);
        return true;
      }
      throw refusal(slug);
    }
  }

  let imageUrn = "";
  try {
    if (image) imageUrn = await uploadLinkedInImage(imageFile(image), personUrn(personId));
  } catch (error) {
    if (git) await releaseClaim(git, slug);
    throw error;
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
    const definite = isDefiniteLinkedInRejection(response.status);
    if (git && definite) await releaseClaim(git, slug);
    const hint = git && !definite
      ? ` The claim refs/linkedin-claims/${slug} was kept so this will not post twice.`
      : "";
    throw new LinkedInRequestError(`LinkedIn returned ${response.status}: ${redact(body).slice(0, 500)}${hint}`, response.status);
  }

  const urn = response.headers.get("x-restli-id") || "";
  if (!urn.startsWith("urn:")) {
    const kept = git ? ` The claim refs/linkedin-claims/${slug} was kept so this will not post twice.` : "";
    throw new Error(`LinkedIn did not return a post URN.${kept}`);
  }
  const url = `https://www.linkedin.com/feed/update/${urn}`;
  console.log(`Posted ${slug} ${urn}`);
  if (git) {
    await git.writeClaim(slug, { state: "posted", urn, url });
    await recordOnMain(git, fileName, raw, urn, url);
    await releaseClaim(git, slug);
  } else {
    writeFileSync(fullPath, withIds(raw, urn, url));
  }
  return true;
}

async function main() {
  if (!token || !personId) {
    console.log("Skipping LinkedIn publish: LINKEDIN_ACCESS_TOKEN or LINKEDIN_PERSON_ID is not set.");
    return;
  }
  const githubToken = process.env.GH_TOKEN || "";
  if (process.env.GITHUB_ACTIONS === "true" && !githubToken) {
    console.error("GH_TOKEN is required so the LinkedIn id is recorded with a signed commit.");
    process.exitCode = 1;
    return;
  }
  const git = githubToken ? createVerifiedGit(githubToken) : null;
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
      await publishFile(name, git);
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
