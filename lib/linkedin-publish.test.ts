import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publishToLinkedIn } from "./linkedin-publish.ts";

describe("LinkedIn media upload", () => {
  it("refuses redirects on the initialize and upload requests that send the bearer token", async () => {
    const calls: { url: string; redirect?: RequestRedirect; authorization: string }[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      calls.push({ url, redirect: init?.redirect, authorization: headers.get("authorization") ?? "" });
      if (url.includes("initializeUpload")) {
        return Response.json({
          value: { uploadUrl: "https://www.linkedin.com/dms-uploads/a.png", image: "urn:li:image:1" },
        });
      }
      if (url.includes("/dms-uploads/")) return new Response(null, { status: 201 });
      return new Response(null, { status: 201, headers: { "x-restli-id": "urn:li:share:1" } });
    };

    const urn = await publishToLinkedIn({
      accessToken: "linkedin-access-token",
      version: "202609",
      authorUrn: "urn:li:person:owner",
      commentary: "Note https://alghazzi.org/posts/example",
      title: "Note",
      description: "A note",
      source: "https://alghazzi.org/posts/example",
      image: { bytes: Buffer.from("png"), contentType: "image/png", alt: "Cover" },
      fetchImpl,
    });

    assert.equal(urn, "urn:li:share:1");
    const media = calls.filter((call) => call.authorization.includes("linkedin-access-token") && (call.url.includes("initializeUpload") || call.url.includes("/dms-uploads/")));
    assert.equal(media.length, 2);
    assert.equal(media.every((call) => call.redirect === "error"), true);
  });
});
