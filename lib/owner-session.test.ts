import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authorReturnPath } from "./linkedin.ts";
import { isOwner, openOwnerSession, sealOwnerSession } from "./owner-session.ts";

describe("owner session", () => {
  it("compares the member id with or without the person urn", () => {
    const previous = process.env.LINKEDIN_PERSON_ID;
    process.env.LINKEDIN_PERSON_ID = "urn:li:person:owner-id";
    try {
      assert.equal(isOwner("owner-id"), true);
      assert.equal(isOwner("urn:li:person:owner-id"), true);
      assert.equal(isOwner("someone-else"), false);
      assert.equal(isOwner(""), false);
    } finally {
      if (previous === undefined) delete process.env.LINKEDIN_PERSON_ID;
      else process.env.LINKEDIN_PERSON_ID = previous;
    }
  });

  it("seals an HttpOnly-cookie payload and rejects tampering, expiry, and other members", () => {
    const previousSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const previousPerson = process.env.LINKEDIN_PERSON_ID;
    process.env.LINKEDIN_CLIENT_SECRET = "test-client-secret";
    process.env.LINKEDIN_PERSON_ID = "owner-id";
    try {
      const now = 1_700_000_000_000;
      const sealed = sealOwnerSession("urn:li:person:owner-id", now);
      assert.equal(openOwnerSession(sealed, now)?.personId, "owner-id");
      assert.equal(openOwnerSession(`${sealed.slice(0, -1)}x`, now), null);
      assert.equal(openOwnerSession(sealed, now + 13 * 60 * 60 * 1000), null);
      assert.equal(openOwnerSession(sealOwnerSession("intruder", now), now), null);
    } finally {
      if (previousSecret === undefined) delete process.env.LINKEDIN_CLIENT_SECRET;
      else process.env.LINKEDIN_CLIENT_SECRET = previousSecret;
      if (previousPerson === undefined) delete process.env.LINKEDIN_PERSON_ID;
      else process.env.LINKEDIN_PERSON_ID = previousPerson;
    }
  });

  it("returns to the authoring page only", () => {
    assert.equal(authorReturnPath("/posts/new"), "/posts/new");
    assert.equal(authorReturnPath("/posts/new?next=https://evil.example"), "");
    assert.equal(authorReturnPath("https://alghazzi.org/posts/new"), "");
    assert.equal(authorReturnPath("/linkedin/connected"), "");
    assert.equal(authorReturnPath(""), "");
  });
});
