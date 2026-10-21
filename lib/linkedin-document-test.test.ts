import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { testLinkedInDocumentUpload } from "./linkedin-document-test.ts";
import { sealToken } from "./linkedin.ts";
import { createMemoryPostsDb } from "./memory-posts.ts";

const now = new Date("2026-10-21T09:00:00Z");

function pdfBytes() {
  return Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
}

function documentPath() {
  return `documents/${"ab".repeat(16)}.pdf`;
}

async function withOwner<T>(run: () => Promise<T>) {
  const previousSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const previousPerson = process.env.LINKEDIN_PERSON_ID;
  process.env.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";
  process.env.LINKEDIN_PERSON_ID = "owner-person";
  try {
    return await run();
  } finally {
    if (previousSecret === undefined) delete process.env.LINKEDIN_CLIENT_SECRET;
    else process.env.LINKEDIN_CLIENT_SECRET = previousSecret;
    if (previousPerson === undefined) delete process.env.LINKEDIN_PERSON_ID;
    else process.env.LINKEDIN_PERSON_ID = previousPerson;
  }
}

describe("LinkedIn document upload test", () => {
  it("uploads the PDF and never calls /rest/posts", async () => {
    await withOwner(async () => {
      const db = createMemoryPostsDb();
      await db.saveConnection({
        access_token: sealToken("access-token"),
        expires_at: "2026-12-01T00:00:00.000Z",
        person_id: "owner-person",
        person_urn: "urn:li:person:owner-person",
        name: "Tareq",
        email: "",
      });
      const path = documentPath();
      await db.uploadDocument(path, pdfBytes());
      const calls: string[] = [];
      const fetchImpl: typeof fetch = async (input, init) => {
        const url = String(input);
        calls.push(`${init?.method ?? "GET"} ${url}`);
        if (url.includes("/rest/posts")) throw new Error("must not publish");
        if (url.includes("/rest/documents?action=initializeUpload")) {
          const body = JSON.parse(String(init?.body)) as { initializeUploadRequest?: { owner?: string } };
          assert.equal(body.initializeUploadRequest?.owner, "urn:li:person:owner-person");
          return Response.json({
            value: {
              uploadUrl: "https://www.linkedin.com/dms-uploads/document.pdf",
              document: "urn:li:document:C5F10AQ",
            },
          });
        }
        if (url.startsWith("https://www.linkedin.com/dms-uploads/")) {
          assert.equal(init?.method, "PUT");
          return new Response(null, { status: 201 });
        }
        if (url.includes("/rest/documents/")) {
          assert.equal(init?.method, "GET");
          return Response.json({ status: "PROCESSING", id: "urn:li:document:C5F10AQ" });
        }
        return new Response("unexpected", { status: 500 });
      };
      const result = await testLinkedInDocumentUpload({ db, documentPath: path, now, fetchImpl });
      assert.deepEqual(result, {
        documentUrn: "urn:li:document:C5F10AQ",
        uploaded: true,
        status: "PROCESSING",
      });
      assert.equal(calls.some((call) => call.includes("/rest/posts")), false);
      assert.equal(calls.some((call) => call.includes("/rest/documents?action=initializeUpload")), true);
      assert.equal(calls.some((call) => call.startsWith("PUT https://www.linkedin.com/dms-uploads/")), true);
    });
  });

  it("reports that the status cannot be read when LinkedIn returns 403", async () => {
    await withOwner(async () => {
      const db = createMemoryPostsDb();
      await db.saveConnection({
        access_token: sealToken("access-token"),
        expires_at: "2026-12-01T00:00:00.000Z",
        person_id: "owner-person",
        person_urn: "urn:li:person:owner-person",
        name: "Tareq",
        email: "",
      });
      const path = documentPath();
      await db.uploadDocument(path, pdfBytes());
      const calls: string[] = [];
      const fetchImpl: typeof fetch = async (input, init) => {
        const url = String(input);
        calls.push(url);
        if (url.includes("/rest/posts")) throw new Error("must not publish");
        if (url.includes("action=initializeUpload")) {
          return Response.json({
            value: { uploadUrl: "https://www.linkedin.com/dms-uploads/document.pdf", document: "urn:li:document:STATUS" },
          });
        }
        if (url.startsWith("https://www.linkedin.com/dms-uploads/")) return new Response(null, { status: 201 });
        if (url.includes("/rest/documents/")) return new Response("forbidden", { status: 403 });
        return new Response("unexpected", { status: 500 });
      };
      const result = await testLinkedInDocumentUpload({ db, documentPath: path, now, fetchImpl });
      assert.equal(result.uploaded, true);
      assert.equal(result.documentUrn, "urn:li:document:STATUS");
      assert.equal(result.status, "The document status can't be read.");
      assert.equal(calls.some((call) => call.includes("/rest/posts")), false);
    });
  });
});
