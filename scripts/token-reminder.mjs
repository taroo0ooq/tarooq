import { absoluteUrl } from "../lib/site-url.mjs";

const expires = process.env.LINKEDIN_TOKEN_EXPIRES || "";
const repo = process.env.GITHUB_REPOSITORY || "";
const githubToken = process.env.GITHUB_TOKEN || "";

function logAndStop(message) {
  console.log(message);
}

async function github(pathname, init) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "User-Agent": "tarooq-token-reminder",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub returned ${response.status}: ${body.slice(0, 300)}`);
  }
  return response.json();
}

async function main() {
  if (!expires) {
    logAndStop("LINKEDIN_TOKEN_EXPIRES is not set. Skipping reminder.");
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expires) || Number.isNaN(Date.parse(`${expires}T00:00:00Z`))) {
    logAndStop("LINKEDIN_TOKEN_EXPIRES is not YYYY-MM-DD. Skipping reminder.");
    return;
  }
  const expiry = Date.parse(`${expires}T00:00:00Z`);
  const horizon = Date.now() + 14 * 24 * 60 * 60 * 1000;
  if (expiry > horizon) {
    logAndStop(`Token expires ${expires}. Outside the 14-day window.`);
    return;
  }
  if (!repo || !githubToken) {
    throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required to open a reminder issue.");
  }

  const issues = await github(`/repos/${repo}/issues?state=open&per_page=50`);
  const existing = Array.isArray(issues) && issues.some((issue) => String(issue.title || "").startsWith("Renew LinkedIn access"));
  if (existing) {
    logAndStop("A LinkedIn renewal issue is already open.");
    return;
  }

  await github(`/repos/${repo}/issues`, {
    method: "POST",
    body: JSON.stringify({
      title: `Renew LinkedIn access before ${expires}`,
      body: [
        `The LinkedIn member token expires on ${expires}.`,
        "",
        `1. Open ${absoluteUrl("/api/linkedin/start")} and sign in as the member who publishes.`,
        "2. Copy the token into the Vercel env LINKEDIN_ACCESS_TOKEN and the GitHub secret LINKEDIN_ACCESS_TOKEN.",
        "3. Copy the person id into LINKEDIN_PERSON_ID on Vercel and as a GitHub secret. The raw id or urn:li:person:<id> both work.",
        "4. Set the GitHub variable LINKEDIN_TOKEN_EXPIRES to the new YYYY-MM-DD.",
        "",
        "Posts go out as that member, not as the company page.",
      ].join("\n"),
    }),
  });
  console.log(`Opened a reminder for ${expires}.`);
}

await main();
