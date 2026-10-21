import { openToken, personUrn } from "./linkedin";
import { isOwner } from "./owner-session";
import { LinkedInPublishError, uploadLinkedInDocument } from "./linkedin-publish";
import { assertDocumentPath, assertPdf } from "./post-document";
import { PostInputError } from "./post-draft";
import type { PostsDb } from "./post-types";

export type DocumentUploadTest = {
  documentUrn: string;
  uploaded: true;
  status: string;
};

const STATUS_UNREADABLE = "The document status can't be read.";

function linkedInHeaders(token: string, version: string) {
  return {
    authorization: `Bearer ${token}`,
    "linkedin-version": version,
    "x-restli-protocol-version": "2.0.0",
  };
}

async function openConnection(db: PostsDb, now: Date) {
  const row = await db.getConnection();
  if (!row) throw new PostInputError("Connect LinkedIn before posting there.", 409);
  const token = openToken(row.access_token);
  if (!token) throw new PostInputError("The saved LinkedIn token could not be read. Connect LinkedIn again.", 409);
  if (new Date(row.expires_at).getTime() <= now.getTime()) {
    throw new PostInputError("The LinkedIn token has expired. Connect LinkedIn again.", 409);
  }
  if (!isOwner(row.person_id)) throw new PostInputError("The saved LinkedIn account is not the site owner.", 403);
  return { token, authorUrn: row.person_urn || personUrn(row.person_id) };
}

async function readDocumentStatus(urn: string, token: string, version: string, fetchImpl: typeof fetch) {
  let response: Response;
  try {
    response = await fetchImpl(`https://api.linkedin.com/rest/documents/${encodeURIComponent(urn)}`, {
      method: "GET",
      headers: linkedInHeaders(token, version),
      redirect: "error",
    });
  } catch {
    return STATUS_UNREADABLE;
  }
  if (response.status === 403) return STATUS_UNREADABLE;
  let text = "";
  try {
    text = await response.text();
  } catch {
    return STATUS_UNREADABLE;
  }
  if (!response.ok) return `Uploaded. Status check returned ${response.status}.`;
  try {
    const payload = JSON.parse(text) as { status?: unknown };
    if (typeof payload.status === "string" && payload.status) return payload.status;
  } catch {
    return "Uploaded. LinkedIn did not return a status.";
  }
  return "Uploaded. LinkedIn did not return a status.";
}

/** Upload a stored PDF to LinkedIn and stop. This never creates a post. */
export async function testLinkedInDocumentUpload(input: {
  db: PostsDb;
  documentPath: string;
  now?: Date;
  version?: string;
  fetchImpl?: typeof fetch;
}): Promise<DocumentUploadTest> {
  assertDocumentPath(input.documentPath);
  const stored = await input.db.readDocument(input.documentPath);
  if (!stored) throw new PostInputError("The uploaded PDF could not be read.");
  assertPdf(stored.bytes);
  const now = input.now ?? new Date();
  const version = input.version || process.env.LINKEDIN_VERSION || "202609";
  const connection = await openConnection(input.db, now);
  const fetchImpl = input.fetchImpl ?? fetch;
  let documentUrn: string;
  try {
    documentUrn = await uploadLinkedInDocument({
      accessToken: connection.token,
      version,
      authorUrn: connection.authorUrn,
      bytes: stored.bytes,
      fetchImpl,
    });
  } catch (error) {
    if (error instanceof LinkedInPublishError || error instanceof PostInputError) throw error;
    throw new LinkedInPublishError(error instanceof Error ? error.message : "LinkedIn document upload failed.", 502);
  }
  const status = await readDocumentStatus(documentUrn, connection.token, version, fetchImpl);
  return { documentUrn, uploaded: true, status };
}
