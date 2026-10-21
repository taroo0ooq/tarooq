import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  LINKEDIN_RECORD_MESSAGE,
  decideLinkedIn,
  isDefiniteLinkedInRejection,
  parseClaim,
  parsePublishPayload,
} from "./publish-plan.ts";
import { PostInputError } from "./post-draft.ts";

const sha = "a".repeat(40);
const other = "b".repeat(40);

describe("publish payload", () => {
  it("accepts one post and a matching image", () => {
    const payload = parsePublishPayload({
      message: "Post: Hello",
      slug: "2026-10-21-hello",
      files: [
        { path: "content/posts/2026-10-21-hello.mdx", sha },
        { path: "public/posts/hello.png", sha: other },
      ],
    });
    assert.equal(payload.files.length, 2);
  });

  it("rejects traversal, mismatched images, and the linkedin marker", () => {
    assert.throws(() => parsePublishPayload({
      message: "Post: Hello",
      slug: "2026-10-21-hello",
      files: [{ path: "content/posts/../../secrets.mdx", sha }],
    }), PostInputError);
    assert.throws(() => parsePublishPayload({
      message: "Post: Hello",
      slug: "2026-10-21-hello",
      files: [
        { path: "content/posts/2026-10-21-hello.mdx", sha },
        { path: "public/posts/other.png", sha: other },
      ],
    }), /does not match/);
    assert.throws(() => parsePublishPayload({
      message: "Post: Hello [linkedin]",
      slug: "2026-10-21-hello",
      files: [{ path: "content/posts/2026-10-21-hello.mdx", sha }],
    }), /commit message/);
  });
});

describe("linkedin once", () => {
  it("posts only a ready post that has not been claimed", () => {
    assert.equal(decideLinkedIn("ready", "", null), "post");
    assert.equal(decideLinkedIn("ready", "", { state: "posting" }), "refuse");
    assert.equal(decideLinkedIn("ready", "", { state: "posted", urn: "urn:li:share:1", url: "https://www.linkedin.com/feed/update/urn:li:share:1" }), "recover");
    assert.equal(decideLinkedIn("posted", "", null), "skip");
    assert.equal(decideLinkedIn("ready", "urn:li:share:1", null), "skip");
    assert.equal(decideLinkedIn("hold", "", null), "skip");
    assert.equal(decideLinkedIn("publishing", "", null), "skip");
  });

  it("treats only a definite client rejection as safe to retry", () => {
    assert.equal(isDefiniteLinkedInRejection(422), true);
    assert.equal(isDefiniteLinkedInRejection(401), true);
    assert.equal(isDefiniteLinkedInRejection(408), false);
    assert.equal(isDefiniteLinkedInRejection(429), false);
    assert.equal(isDefiniteLinkedInRejection(500), false);
    assert.equal(isDefiniteLinkedInRejection(0), false);
  });

  it("reads a claim and ignores anything else", () => {
    assert.deepEqual(parseClaim('{"state":"posting"}'), { state: "posting" });
    assert.throws(() => parseClaim('{"state":"posted","urn":"nope","url":"https://evil.example"}'), /unreadable/);
  });
});

describe("workflow contract", () => {
  it("commits through the Actions token and does not push or call a deploy hook", () => {
    const workflow = readFileSync(".github/workflows/publish-linkedin.yml", "utf8");
    assert.match(workflow, /repository_dispatch:/);
    assert.match(workflow, /publish-post/);
    assert.match(workflow, /GH_TOKEN: \$\{\{ github\.token \}\}/);
    assert.match(workflow, /--import \.\/scripts\/register-ts-test\.mjs scripts\/commit-dispatch\.mjs/);
    assert.match(workflow, /--import \.\/scripts\/register-ts-test\.mjs scripts\/publish-linkedin\.mjs/);
    assert.match(workflow, /contains\(github\.event\.head_commit\.message, '\[linkedin\]'\)/);
    assert.equal(workflow.includes("git push"), false);
    assert.equal(workflow.includes("git commit"), false);
    assert.equal(workflow.includes("VERCEL_DEPLOY_HOOK"), false);
    assert.equal(LINKEDIN_RECORD_MESSAGE.includes("[linkedin]"), true);
    const vercel = readFileSync("vercel.json", "utf8");
    assert.match(vercel, /scripts\/vercel-ignore\.mjs/);
  });
});
