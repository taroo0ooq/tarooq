import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPost, parseFrontmatter, renderMarkdown } from "./posts.ts";

describe("post frontmatter", () => {
  it("reads an image, alt text, language, and a multi-paragraph commentary", () => {
    const raw = `---
title: "Example"
date: 2026-10-20
description: "One sentence."
lang: ar
image: /posts/example.png
imageAlt: "Kubernetes containers at the center"
linkedinText: |
  Hello

  https://alghazzi.org/posts/example
---

First paragraph.

Second paragraph.
`;
    const { data, body } = parseFrontmatter(raw);
    assert.equal(data.lang, "ar");
    assert.equal(data.image, "/posts/example.png");
    assert.equal(data.imageAlt, "Kubernetes containers at the center");
    assert.equal(data.linkedinText, "Hello\n\nhttps://alghazzi.org/posts/example");
    assert.match(body, /First paragraph\.\n\nSecond paragraph\./);
  });
});

describe("markdown", () => {
  it("keeps English posts free of direction marks", () => {
    const html = renderMarkdown("Kubernetes matters.\n\n**Cost** and [policy](https://example.com).");
    assert.equal(html.includes("\u2066"), false);
    assert.match(html, /<p>Kubernetes matters\.<\/p>/);
    assert.match(html, /<strong>Cost<\/strong>/);
    assert.match(html, /<a href="https:\/\/example\.com">policy<\/a>/);
  });

  it("keeps an English phrase together inside Arabic", () => {
    const html = renderMarkdown("الـ Kubernetes هو service. من Entra ID والـ landing zone.", "ar");
    assert.match(html, /الـ \u2066Kubernetes\u2069 هو \u2066service\u2069\./);
    assert.match(html, /\u2066Entra ID\u2069/);
    assert.match(html, /\u2066landing zone\u2069\./);
    assert.equal(html.includes("\u2066Entra\u2069"), false);
    assert.equal(html.includes("service.\u2069"), false);
  });
});

describe("kubernetes post", () => {
  it("is released to LinkedIn, in Arabic, with the illustration", () => {
    const post = getPost("2026-10-20-kubernetes-isnt-cloud");
    assert.ok(post);
    assert.equal(post.title, "Knowing Kubernetes isn't knowing the cloud");
    assert.equal(post.date, "2026-10-20");
    assert.equal(post.lang, "ar");
    assert.equal(post.image, "/posts/2026-10-20-kubernetes-isnt-cloud.png");
    assert.match(post.imageAlt, /Kubernetes containers at the center/);
    assert.match(post.imageAlt, /identity, network, firewall, policy, and cost/);
    assert.ok(["ready", "posted"].includes(post.linkedinStatus));
    assert.equal(post.linkedinText.includes("مهمة كتير?!"), false);
    assert.match(post.linkedinText, /مهمة كتير!/);
    assert.match(post.linkedinText, /\n\nhttps:\/\/alghazzi\.org\/posts\/2026-10-20-kubernetes-isnt-cloud$/);
    assert.equal(post.linkedinText.includes("\u2066"), false);
    assert.equal(post.html.includes("مهمة كتير?!"), false);
    assert.match(post.html, /مهمة كتير!/);
    assert.match(post.html, /\u2066Kubernetes\u2069/);
    assert.match(post.html, /\u2066Entra ID\u2069/);
    assert.match(post.html, /\u2066private DNS zone\u2069/);
    assert.ok((post.html.match(/<p>/g) || []).length >= 6);
  });

  it("keeps the earlier post as an English article without an image", () => {
    const post = getPost("2026-10-12-regional-capability");
    assert.ok(post);
    assert.equal(post.lang, "");
    assert.equal(post.image, "");
    assert.equal(post.html.includes("\u2066"), false);
    assert.match(post.linkedinText, /Maturity is the operating model/);
    assert.match(post.linkedinText, /https:\/\/alghazzi\.org\/posts\/2026-10-12-regional-capability/);
  });
});
