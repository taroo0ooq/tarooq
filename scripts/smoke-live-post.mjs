import { createHash, createHmac, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";

const secret = "sb_secret_smoke_live_post";
const linkedInSecret = "smoke-linkedin-secret";
const personId = "owner-person";
const title = "Live without a rebuild";
const port = Number(process.env.SMOKE_PORT || 3456);

function sealOwner(id) {
  const key = createHash("sha256").update(linkedInSecret).digest();
  const payload = Buffer.from(JSON.stringify({ personId: id, exp: Date.now() + 12 * 60 * 60 * 1000 })).toString("base64url");
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function send(res, status, body, type = "application/json") {
  const payload = body == null ? "" : typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(payload);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function slugFilter(url) {
  const raw = url.searchParams.get("slug");
  if (!raw?.startsWith("eq.")) return "";
  return decodeURIComponent(raw.slice(3));
}

function startMock() {
  const posts = [];
  const images = new Map();
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const apiKey = req.headers.apikey || "";
      const auth = req.headers.authorization || "";
      if (apiKey !== secret || auth !== `Bearer ${secret}`) {
        send(res, 401, { message: "missing secret" });
        return;
      }
      if (url.pathname === "/rest/v1/posts" && req.method === "GET") {
        let rows = [...posts];
        const slug = slugFilter(url);
        if (slug) rows = rows.filter((row) => row.slug === slug);
        rows.sort((a, b) => b.published_on.localeCompare(a.published_on) || b.slug.localeCompare(a.slug));
        const limit = Number(url.searchParams.get("limit") || 0);
        if (limit > 0) rows = rows.slice(0, limit);
        send(res, 200, rows);
        return;
      }
      if (url.pathname === "/rest/v1/posts" && req.method === "POST") {
        const row = JSON.parse((await readBody(req)).toString("utf8") || "{}");
        if (posts.some((item) => item.slug === row.slug)) {
          send(res, 409, { message: "duplicate key value violates unique constraint" });
          return;
        }
        const now = new Date().toISOString();
        const saved = { ...row, id: randomUUID(), created_at: now, updated_at: now };
        posts.push(saved);
        send(res, 201, [saved]);
        return;
      }
      if (url.pathname === "/rest/v1/posts" && req.method === "PATCH") {
        const slug = slugFilter(url);
        const patch = JSON.parse((await readBody(req)).toString("utf8") || "{}");
        const current = posts.find((row) => row.slug === slug);
        if (!current) {
          send(res, 200, []);
          return;
        }
        Object.assign(current, patch, { updated_at: new Date().toISOString() });
        send(res, 200, [current]);
        return;
      }
      if (url.pathname === "/rest/v1/posts" && req.method === "DELETE") {
        const slug = slugFilter(url);
        const index = posts.findIndex((row) => row.slug === slug);
        if (index >= 0) posts.splice(index, 1);
        send(res, 204, null);
        return;
      }
      if (url.pathname === "/rest/v1/rpc/linkedin_connection" && req.method === "POST") {
        send(res, 200, []);
        return;
      }
      if (url.pathname.startsWith("/rest/v1/rpc/") && req.method === "POST") {
        send(res, 200, null);
        return;
      }
      if (url.pathname.startsWith("/storage/v1/object/post-images/")) {
        const objectPath = decodeURIComponent(url.pathname.slice("/storage/v1/object/post-images/".length));
        if (req.method === "POST") {
          images.set(objectPath, { bytes: await readBody(req), type: req.headers["content-type"] || "application/octet-stream" });
          send(res, 200, { Key: objectPath });
          return;
        }
        if (req.method === "DELETE") {
          images.delete(objectPath);
          send(res, 200, null);
          return;
        }
        if (req.method === "GET") {
          const file = images.get(objectPath);
          if (!file) {
            send(res, 404, { message: "not found" });
            return;
          }
          res.writeHead(200, { "content-type": file.type });
          res.end(file.bytes);
          return;
        }
      }
      send(res, 404, { message: `unhandled ${req.method} ${url.pathname}` });
    } catch (error) {
      send(res, 500, { message: error instanceof Error ? error.message : "mock failed" });
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("mock did not bind"));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}`, posts });
    });
  });
}

function startNext(env) {
  const child = spawn("npx", ["next", "start", "-p", String(port), "-H", "127.0.0.1"], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    logs += chunk.toString();
  });
  return { child, logs: () => logs };
}

async function waitFor(url) {
  const started = Date.now();
  let last = "";
  while (Date.now() - started < 30_000) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      last = `${response.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : "unreachable";
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url} (${last})`);
}

function assertIncludes(html, needle, label) {
  if (!html.includes(needle)) throw new Error(`${label} did not include ${JSON.stringify(needle)}`);
}

function assertExcludes(html, needle, label) {
  if (html.includes(needle)) throw new Error(`${label} still included ${JSON.stringify(needle)}`);
}

const mock = await startMock();
const env = {
  ...process.env,
  SUPABASE_URL: mock.url,
  SUPABASE_SECRET_KEY: secret,
  LINKEDIN_CLIENT_ID: "smoke-client",
  LINKEDIN_CLIENT_SECRET: linkedInSecret,
  LINKEDIN_PERSON_ID: personId,
};
let nextProcess = null;
try {
  const build = spawn("npx", ["next", "build"], { env, stdio: "inherit" });
  const [code] = await once(build, "exit");
  if (code !== 0) throw new Error(`next build exited ${code}`);

  const started = startNext(env);
  nextProcess = started.child;
  const origin = `http://127.0.0.1:${port}`;
  const before = await waitFor(`${origin}/posts/2026-10-21-syrias-digital-systems`);
  const beforeHtml = await before.text();
  assertIncludes(beforeHtml, "Syria's digital systems", "empty-database post");

  const cookie = sealOwner(personId);
  const created = await fetch(`${origin}/api/owner/posts`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `li_owner=${cookie}`,
    },
    body: JSON.stringify({
      intent: "publish",
      title,
      description: "A post created after the production build.",
      lang: "en",
      body: "This paragraph was not in the repository when the site was built.",
      linkedinText: "Site only.",
      publish: "site",
      seoTitle: "Live without a rebuild",
      seoDescription: "Published from the desk after the build.",
    }),
  });
  const payload = await created.json();
  if (!created.ok) throw new Error(`publish failed ${created.status}: ${JSON.stringify(payload)}`);
  if (!payload.url?.endsWith(`/posts/${payload.post.slug}`)) {
    throw new Error(`unexpected publish payload ${JSON.stringify(payload)}`);
  }
  const slug = payload.post.slug;
  const page = await fetch(`${origin}/posts/${slug}`);
  const html = await page.text();
  if (page.status !== 200) throw new Error(`new slug returned ${page.status}`);
  assertIncludes(html, title, "new English post");
  const arabic = await fetch(`${origin}/ar/posts/${slug}`);
  const arabicHtml = await arabic.text();
  if (arabic.status !== 200) throw new Error(`Arabic slug returned ${arabic.status}`);
  assertIncludes(arabicHtml, title, "new Arabic URL");
  const index = await fetch(`${origin}/posts`);
  const indexHtml = await index.text();
  assertIncludes(indexHtml, title, "posts index");
  assertExcludes(indexHtml, "Syria's digital systems", "posts index after Supabase became the source");
  const sitemap = await fetch(`${origin}/sitemap.xml`);
  const xml = await sitemap.text();
  assertIncludes(xml, `/posts/${slug}`, "sitemap");
  console.log(`smoke ok ${slug}`);
  if (process.env.SMOKE_KEEP === "1") {
    console.log(`SMOKE_ORIGIN=${origin}`);
    console.log(`SMOKE_COOKIE=${cookie}`);
    console.log(`SMOKE_SLUG=${slug}`);
    await new Promise(() => {});
  }
} catch (error) {
  nextProcess?.kill("SIGTERM");
  await new Promise((resolve) => mock.server.close(resolve));
  throw error;
}
nextProcess?.kill("SIGTERM");
await new Promise((resolve) => mock.server.close(resolve));
