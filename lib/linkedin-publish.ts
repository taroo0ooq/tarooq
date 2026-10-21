import { LINKEDIN_LIMIT, PostInputError } from "./post-draft";
import { redactSecrets } from "./secrets";

export class LinkedInPublishError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "LinkedInPublishError";
    this.status = status;
  }
}

export const DOCUMENT_RETRY_WAITS_MS = [2_000, 4_000, 8_000, 16_000, 30_000];

export function isDefiniteLinkedInRejection(status: number) {
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

export function linkedInUrl(urn: string) {
  return `https://www.linkedin.com/feed/update/${urn}`;
}

export function parseLinkedInUrn(value: string) {
  const match = /urn:li:(?:share|ugcPost|activity):\d+/.exec(value.trim());
  if (!match) throw new PostInputError("Paste a LinkedIn post URN or its feed URL.");
  return match[0];
}

export function assertCommentary(commentary: string, source: string, hasImage: boolean, requireSource = hasImage) {
  if (!commentary) throw new PostInputError("LinkedIn text is required when posting to LinkedIn.");
  if (commentary.length > LINKEDIN_LIMIT) {
    throw new PostInputError(`LinkedIn text is ${commentary.length} characters. The limit is ${LINKEDIN_LIMIT}.`);
  }
  if (requireSource && !commentary.includes(source)) {
    throw new PostInputError(`LinkedIn text must include ${source} when the post has an image.`);
  }
}

export function documentStillProcessing(status: number, body: string) {
  if (status === 408 || status === 429 || status >= 500) return true;
  if (status !== 400 && status !== 404 && status !== 409 && status !== 422) return false;
  return /not ready|still processing|processing|try again|unavailable|not available|waiting_upload|media asset/i.test(body);
}

function redact(value: string, secret: string) {
  return redactSecrets(secret ? value.split(secret).join("[redacted]") : value);
}

function assertUploadUrl(uploadUrl: string, kind: "image" | "document") {
  let url: URL;
  try {
    url = new URL(uploadUrl);
  } catch {
    throw new LinkedInPublishError(`LinkedIn ${kind} initialize returned an invalid upload URL.`, 502);
  }
  const host = url.hostname;
  const allowed = host === "linkedin.com" || host.endsWith(".linkedin.com") || host.endsWith(".licdn.com");
  if (url.protocol !== "https:" || !allowed) {
    throw new LinkedInPublishError(`LinkedIn ${kind} initialize returned an unexpected upload URL.`, 502);
  }
}

async function readBody(response: Response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function defaultSleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function publishToLinkedIn(input: {
  accessToken: string;
  version: string;
  authorUrn: string;
  commentary: string;
  title: string;
  description: string;
  source: string;
  image: { bytes: Buffer; contentType: string; alt: string } | null;
  document?: { bytes: Buffer; title: string } | null;
  linkPlacement?: "text" | "comment";
  sleep?: (ms: number) => Promise<void>;
  fetchImpl?: typeof fetch;
}) {
  const fetchImpl = input.fetchImpl ?? fetch;
  const token = input.accessToken;
  const linkPlacement = input.linkPlacement === "comment" ? "comment" : "text";
  const document = input.document ?? null;
  if (input.image && document) throw new PostInputError("Choose an image or a PDF, not both.");
  if (document && !document.title.trim()) throw new PostInputError("Document title is required.");
  assertCommentary(input.commentary, input.source, Boolean(input.image), linkPlacement === "text" && Boolean(input.image));
  const headers = (extra: Record<string, string> = {}) => ({
    authorization: `Bearer ${token}`,
    "linkedin-version": input.version,
    "x-restli-protocol-version": "2.0.0",
    ...extra,
  });

  let imageUrn = "";
  let documentUrn = "";
  if (input.image) {
    if (input.image.contentType === "image/webp" || input.image.contentType === "image/gif") {
      throw new PostInputError("LinkedIn accepts PNG or JPEG. WebP can be used for a site-only post.");
    }
    imageUrn = await uploadLinkedInMedia({
      kind: "image",
      endpoint: "https://api.linkedin.com/rest/images?action=initializeUpload",
      urnKey: "image",
      urnPrefix: "urn:li:image:",
      bytes: input.image.bytes,
      authorUrn: input.authorUrn,
      fetchImpl,
      headers,
      token,
    });
  } else if (document) {
    documentUrn = await uploadLinkedInMedia({
      kind: "document",
      endpoint: "https://api.linkedin.com/rest/documents?action=initializeUpload",
      urnKey: "document",
      urnPrefix: "urn:li:document:",
      bytes: document.bytes,
      authorUrn: input.authorUrn,
      fetchImpl,
      headers,
      token,
    });
  }

  const content = imageUrn
    ? { media: { id: imageUrn, ...(input.image?.alt ? { altText: input.image.alt.slice(0, 4086) } : {}) } }
    : documentUrn
      ? { media: { id: documentUrn, title: document?.title.slice(0, 140) ?? "" } }
      : linkPlacement === "comment"
        ? null
        : { article: { source: input.source, title: input.title, description: (input.description || input.title).slice(0, 400) } };

  const sleep = input.sleep ?? defaultSleep;
  const waits = documentUrn ? DOCUMENT_RETRY_WAITS_MS : [];
  let attempt = 0;
  while (true) {
    let response: Response;
    try {
      const payload: Record<string, unknown> = {
        author: input.authorUrn,
        commentary: input.commentary,
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      };
      if (content) payload.content = content;
      response = await fetchImpl("https://api.linkedin.com/rest/posts", {
        method: "POST",
        headers: headers({ "content-type": "application/json" }),
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new LinkedInPublishError(redact(error instanceof Error ? error.message : "LinkedIn could not be reached.", token), 0);
    }
    if (response.status === 201) {
      const urn = response.headers.get("x-restli-id") || "";
      if (!urn.startsWith("urn:")) throw new LinkedInPublishError("LinkedIn did not return a post URN.", 0);
      return urn;
    }
    const body = await readBody(response);
    const wait = waits[attempt];
    if (documentUrn && wait !== undefined && documentStillProcessing(response.status, body)) {
      await sleep(wait);
      attempt += 1;
      continue;
    }
    throw new LinkedInPublishError(redact(`LinkedIn returned ${response.status}: ${body.slice(0, 300)}`, token), response.status);
  }
}

async function uploadLinkedInMedia(input: {
  kind: "image" | "document";
  endpoint: string;
  urnKey: "image" | "document";
  urnPrefix: string;
  bytes: Buffer;
  authorUrn: string;
  fetchImpl: typeof fetch;
  headers: (extra?: Record<string, string>) => Record<string, string>;
  token: string;
}) {
  let init: Response;
  try {
    init = await input.fetchImpl(input.endpoint, {
      method: "POST",
      headers: input.headers({ "content-type": "application/json" }),
      body: JSON.stringify({ initializeUploadRequest: { owner: input.authorUrn } }),
    });
  } catch (error) {
    throw new LinkedInPublishError(redact(error instanceof Error ? error.message : "LinkedIn could not be reached.", input.token), 0);
  }
  const initText = await readBody(init);
  if (!init.ok) {
    throw new LinkedInPublishError(redact(`LinkedIn ${input.kind} initialize returned ${init.status}: ${initText.slice(0, 300)}`, input.token), init.status);
  }
  let payload: { value?: { uploadUrl?: unknown; image?: unknown; document?: unknown } };
  try {
    payload = JSON.parse(initText) as { value?: { uploadUrl?: unknown; image?: unknown; document?: unknown } };
  } catch {
    throw new LinkedInPublishError(`LinkedIn ${input.kind} initialize returned invalid JSON.`, 502);
  }
  const uploadUrl = payload.value?.uploadUrl;
  const returnedUrn = payload.value?.[input.urnKey];
  if (typeof uploadUrl !== "string" || typeof returnedUrn !== "string" || !returnedUrn.startsWith(input.urnPrefix)) {
    throw new LinkedInPublishError(`LinkedIn ${input.kind} initialize did not return an upload URL and ${input.kind} URN.`, 502);
  }
  assertUploadUrl(uploadUrl, input.kind);
  let uploaded: Response;
  try {
    uploaded = await input.fetchImpl(uploadUrl, {
      method: "PUT",
      headers: { authorization: `Bearer ${input.token}`, "content-type": "application/octet-stream" },
      body: new Uint8Array(input.bytes),
    });
  } catch (error) {
    throw new LinkedInPublishError(redact(error instanceof Error ? error.message : `LinkedIn ${input.kind} upload failed.`, input.token), 0);
  }
  if (!uploaded.ok) {
    const body = await readBody(uploaded);
    throw new LinkedInPublishError(redact(`LinkedIn ${input.kind} upload returned ${uploaded.status}: ${body.slice(0, 300)}`, input.token), uploaded.status);
  }
  return returnedUrn;
}
