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

export function assertCommentary(commentary: string, source: string, hasImage: boolean) {
  if (!commentary) throw new PostInputError("LinkedIn text is required when posting to LinkedIn.");
  if (commentary.length > LINKEDIN_LIMIT) {
    throw new PostInputError(`LinkedIn text is ${commentary.length} characters. The limit is ${LINKEDIN_LIMIT}.`);
  }
  if (hasImage && !commentary.includes(source)) {
    throw new PostInputError(`LinkedIn text must include ${source} when the post has an image.`);
  }
}

function redact(value: string, secret: string) {
  return redactSecrets(secret ? value.split(secret).join("[redacted]") : value);
}

function assertUploadUrl(uploadUrl: string) {
  let url: URL;
  try {
    url = new URL(uploadUrl);
  } catch {
    throw new LinkedInPublishError("LinkedIn image initialize returned an invalid upload URL.", 502);
  }
  const host = url.hostname;
  const allowed = host === "linkedin.com" || host.endsWith(".linkedin.com") || host.endsWith(".licdn.com");
  if (url.protocol !== "https:" || !allowed) {
    throw new LinkedInPublishError("LinkedIn image initialize returned an unexpected upload URL.", 502);
  }
}

async function readBody(response: Response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
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
  fetchImpl?: typeof fetch;
}) {
  const fetchImpl = input.fetchImpl ?? fetch;
  const token = input.accessToken;
  assertCommentary(input.commentary, input.source, Boolean(input.image));
  const headers = (extra: Record<string, string> = {}) => ({
    authorization: `Bearer ${token}`,
    "linkedin-version": input.version,
    "x-restli-protocol-version": "2.0.0",
    ...extra,
  });

  let imageUrn = "";
  if (input.image) {
    if (input.image.contentType === "image/webp" || input.image.contentType === "image/gif") {
      throw new PostInputError("LinkedIn accepts PNG or JPEG. WebP can be used for a site-only post.");
    }
    let init: Response;
    try {
      init = await fetchImpl("https://api.linkedin.com/rest/images?action=initializeUpload", {
        method: "POST",
        headers: headers({ "content-type": "application/json" }),
        body: JSON.stringify({ initializeUploadRequest: { owner: input.authorUrn } }),
      });
    } catch (error) {
      throw new LinkedInPublishError(redact(error instanceof Error ? error.message : "LinkedIn could not be reached.", token), 0);
    }
    const initText = await readBody(init);
    if (!init.ok) throw new LinkedInPublishError(redact(`LinkedIn image initialize returned ${init.status}: ${initText.slice(0, 300)}`, token), init.status);
    let payload: { value?: { uploadUrl?: unknown; image?: unknown } };
    try {
      payload = JSON.parse(initText) as { value?: { uploadUrl?: unknown; image?: unknown } };
    } catch {
      throw new LinkedInPublishError("LinkedIn image initialize returned invalid JSON.", 502);
    }
    const uploadUrl = payload.value?.uploadUrl;
    const returnedUrn = payload.value?.image;
    if (typeof uploadUrl !== "string" || typeof returnedUrn !== "string" || !returnedUrn.startsWith("urn:li:image:")) {
      throw new LinkedInPublishError("LinkedIn image initialize did not return an upload URL and image URN.", 502);
    }
    assertUploadUrl(uploadUrl);
    let uploaded: Response;
    try {
      uploaded = await fetchImpl(uploadUrl, {
        method: "PUT",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/octet-stream" },
        body: new Uint8Array(input.image.bytes),
      });
    } catch (error) {
      throw new LinkedInPublishError(redact(error instanceof Error ? error.message : "LinkedIn image upload failed.", token), 0);
    }
    if (!uploaded.ok) {
      const body = await readBody(uploaded);
      throw new LinkedInPublishError(redact(`LinkedIn image upload returned ${uploaded.status}: ${body.slice(0, 300)}`, token), uploaded.status);
    }
    imageUrn = returnedUrn;
  }

  const content = imageUrn
    ? { media: { id: imageUrn, ...(input.image?.alt ? { altText: input.image.alt.slice(0, 4086) } : {}) } }
    : { article: { source: input.source, title: input.title, description: (input.description || input.title).slice(0, 400) } };
  let response: Response;
  try {
    response = await fetchImpl("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: headers({ "content-type": "application/json" }),
      body: JSON.stringify({
        author: input.authorUrn,
        commentary: input.commentary,
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
        content,
      }),
    });
  } catch (error) {
    throw new LinkedInPublishError(redact(error instanceof Error ? error.message : "LinkedIn could not be reached.", token), 0);
  }
  if (response.status !== 201) {
    const body = await readBody(response);
    throw new LinkedInPublishError(redact(`LinkedIn returned ${response.status}: ${body.slice(0, 300)}`, token), response.status);
  }
  const urn = response.headers.get("x-restli-id") || "";
  if (!urn.startsWith("urn:")) throw new LinkedInPublishError("LinkedIn did not return a post URN.", 0);
  return urn;
}
