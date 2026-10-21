import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";
import { robotsPolicy } from "./robots-policy.ts";

describe("robots policy", () => {
  it("allows the site, blocks the private paths, and points at the sitemap", () => {
    const robots = robotsPolicy();
    const rules = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    assert.equal(rules?.userAgent, "*");
    assert.equal(rules?.allow, "/");
    assert.deepEqual(rules?.disallow, ["/api/", "/linkedin/", "/posts/new"]);
    assert.equal(robots.sitemap, "https://alghazzi.org/sitemap.xml");
    assert.equal(robots.host, "https://alghazzi.org");
    const blocked = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];
    assert.equal(blocked.some((path) => path === "/llms.txt" || path === "/llms.txt/"), false);
  });

  it("lives at the app root so the route group does not hide it", () => {
    assert.equal(existsSync("app/robots.ts"), true);
    assert.equal(existsSync("app/(en)/robots.ts"), false);
  });
});
