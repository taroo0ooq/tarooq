const SECRET_NAMES = [
  "GITHUB_CONTENTS_TOKEN",
  "POSTS_API_TOKEN",
  "LINKEDIN_CLIENT_SECRET",
  "LINKEDIN_ACCESS_TOKEN",
  "VERCEL_DEPLOY_HOOK_URL",
] as const;

export function redactSecrets(value: string) {
  let out = String(value);
  for (const name of SECRET_NAMES) {
    const secret = process.env[name];
    if (secret) out = out.split(secret).join("[redacted]");
  }
  return out;
}
