import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseFrontmatter } from "./posts.ts";
import {
  alignPostUrl,
  buildPostMarkdown,
  commitMessage,
  pickSlug,
  PostInputError,
  slugifyTitle,
  statusNote,
} from "./post-draft.ts";

const origin = "https://alghazzi.org";

describe("slugs", () => {
  it("slugifies English titles and drops punctuation", () => {
    assert.equal(slugifyTitle("Knowing Kubernetes isn't knowing the cloud"), "knowing-kubernetes-isnt-knowing-the-cloud");
    assert.equal(slugifyTitle("  Hello---World!!! "), "hello-world");
    assert.equal(slugifyTitle("café"), "cafe");
  });

  it("uses a fallback for Arabic-only titles and caps the length", () => {
    assert.equal(slugifyTitle("معرفة كوبرنيتس ليست معرفة السحابة"), "");
    assert.equal(pickSlug("معرفة كوبرنيتس", "2026-10-20", [], []), "post");
    assert.equal(slugifyTitle(`${"a".repeat(60)} extra`), "a".repeat(48));
    const long = slugifyTitle(`${"word ".repeat(20)}x`);
    assert.ok(long.length <= 48);
    assert.equal(long.endsWith("-"), false);
  });

  it("skips collisions on the post file and on an image with the same slug", () => {
    const date = "2026-10-20";
    assert.equal(pickSlug("Hello", date, [`${date}-hello.mdx`], []), "hello-2");
    assert.equal(pickSlug("Hello", date, [], ["hello.png"]), "hello-2");
    assert.equal(pickSlug("Hello", date, [`${date}-hello.mdx`, `${date}-hello-2.mdx`], ["hello-2.jpg"]), "hello-3");
    assert.equal(pickSlug("Hello", "2026-10-21", ["2026-10-20-hello.mdx"], ["hello-extra.png"]), "hello");
  });

  it("stops after the slug attempts are exhausted", () => {
    const names = ["2026-10-20-post.mdx"];
    for (let n = 2; n < 50; n += 1) names.push(`2026-10-20-post-${n}.mdx`);
    assert.throws(() => pickSlug("!!!", "2026-10-20", names, []), PostInputError);
  });
});

describe("frontmatter", () => {
  it("round-trips Arabic, quotes, colons, and a commentary line that looks like a fence", () => {
    const linkedinText = [
      'قال: "السحابة" أوسع من Kubernetes.',
      "",
      "---",
      "linkedinStatus: posted",
      "",
      "https://alghazzi.org/posts/2026-10-20-post",
    ].join("\n");
    const body = 'فقرة أولى.\n\n---\n\nفقرة فيها "علامات": ونص.';
    const markdown = buildPostMarkdown({
      title: 'معرفة: "Kubernetes"',
      description: "الهوية، الشبكة، والحوكمة: هذا هو الفرق.",
      date: "2026-10-20",
      lang: "ar",
      body,
      linkedinText,
      linkedin: false,
      image: "/posts/post.png",
      imageAlt: 'منصة سحابية: "هوية" وشبكة',
    });

    const { data, body: parsedBody } = parseFrontmatter(markdown);
    assert.equal(data.title, 'معرفة: "Kubernetes"');
    assert.equal(data.description, "الهوية، الشبكة، والحوكمة: هذا هو الفرق.");
    assert.equal(data.date, "2026-10-20");
    assert.equal(data.lang, "ar");
    assert.equal(data.image, "/posts/post.png");
    assert.equal(data.imageAlt, 'منصة سحابية: "هوية" وشبكة');
    assert.equal(data.linkedinStatus, "hold");
    assert.equal(data.linkedinUrn, "");
    assert.equal(data.linkedinUrl, "");
    assert.equal(data.linkedinText, linkedinText);
    assert.equal(parsedBody.trim(), body);
    assert.equal(markdown.includes("\n---\n"), true);
    assert.equal(markdown.split("\n---").length, 3);
  });

  it("marks a LinkedIn post ready and omits lang for English", () => {
    const markdown = buildPostMarkdown({
      title: "A note",
      description: "One line.",
      date: "2026-10-20",
      lang: "en",
      body: "Hello.\n\n---\n\nAgain.",
      linkedinText: "Hello.\n\nhttps://alghazzi.org/posts/2026-10-20-a-note",
      linkedin: true,
    });
    const { data } = parseFrontmatter(markdown);
    assert.equal(data.linkedinStatus, "ready");
    assert.equal(data.lang, undefined);
    assert.equal(data.image, undefined);
  });

  it("rejects a date that could break the file name", () => {
    assert.throws(
      () =>
        buildPostMarkdown({
          title: "A note",
          description: "One line.",
          date: "2026-10-20\nimage: /etc/passwd",
          lang: "en",
          body: "Hello",
          linkedinText: "Hello",
          linkedin: false,
        }),
      PostInputError,
    );
  });
});

describe("post urls", () => {
  it("rewrites the same-day preview url and appends a missing url", () => {
    const shifted = alignPostUrl(
      "Hello\n\nhttps://alghazzi.org/posts/2026-10-20-hello",
      origin,
      "2026-10-20",
      "hello-2",
    );
    assert.equal(shifted, "Hello\n\nhttps://alghazzi.org/posts/2026-10-20-hello-2");

    const appended = alignPostUrl(
      "See also https://alghazzi.org/posts/2026-10-12-regional-capability",
      origin,
      "2026-10-20",
      "hello",
    );
    assert.match(appended, /2026-10-12-regional-capability/);
    assert.match(appended, /https:\/\/alghazzi\.org\/posts\/2026-10-20-hello$/);
  });
});

describe("commit copy", () => {
  it("never includes the workflow skip token", () => {
    assert.equal(commitMessage("A [LinkedIn] note"), "Post: A  note");
    assert.equal(commitMessage("[linkedin]"), "Post: untitled");
    assert.equal(commitMessage("Anything").toLowerCase().includes("[linkedin]"), false);
  });

  it("explains when the site and LinkedIn update", () => {
    assert.match(statusNote(true), /goes live on the site after the Vercel deploy/);
    assert.match(statusNote(true), /LinkedIn publishes after the GitHub workflow runs/);
    assert.match(statusNote(false), /LinkedIn stays on hold/);
  });
});
