import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { contactLetter, deliverContact, type ContactNote } from "./deliver.ts";
import { inbox } from "./inbox.ts";

const note: ContactNote = {
  name: "Jane Doe",
  email: "jane@example.com",
  topic: "Cloud and AI strategy",
  message: "We need a landing zone that survives production.",
  company: "Example Co",
};

const envKeys = ["RESEND_API_KEY", "CONTACT_INBOX", "CONTACT_FROM"] as const;
const previous = new Map<string, string | undefined>();

function saveEnv() {
  for (const key of envKeys) previous.set(key, process.env[key]);
}

function restoreEnv() {
  for (const key of envKeys) {
    const value = previous.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("contact delivery", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("addresses the default inbox and uses the visitor as reply-to", () => {
    saveEnv();
    delete process.env.CONTACT_INBOX;
    delete process.env.CONTACT_FROM;
    const letter = contactLetter(note);
    assert.equal(letter.to, inbox);
    assert.equal(letter.from, "Tarooq <onboarding@resend.dev>");
    assert.equal(letter.replyTo, "jane@example.com");
    assert.equal(letter.subject, "Cloud and AI strategy");
    assert.match(letter.text, /Company: Example Co/);
    assert.match(letter.text, /We need a landing zone that survives production\./);
    assert.equal(letter.text.includes("website"), false);
  });

  it("honors inbox and from overrides and flattens the subject", () => {
    saveEnv();
    process.env.CONTACT_INBOX = "owner@example.com";
    process.env.CONTACT_FROM = "Notes <notes@example.com>";
    const letter = contactLetter({ ...note, topic: "Line one\nLine two", company: "  " });
    assert.equal(letter.to, "owner@example.com");
    assert.equal(letter.from, "Notes <notes@example.com>");
    assert.equal(letter.subject, "Line one Line two");
    assert.equal(letter.text.includes("Company:"), false);
  });

  it("falls back to the sender name when the topic is blank", () => {
    saveEnv();
    const letter = contactLetter({ ...note, topic: "  " });
    assert.equal(letter.subject, "Note from Jane Doe");
  });

  it("does not call the network when the API key is missing", async () => {
    saveEnv();
    delete process.env.RESEND_API_KEY;
    let called = false;
    const result = await deliverContact(note, () => {
      called = true;
      return Promise.resolve(new Response());
    });
    assert.deepEqual(result, { ok: false, reason: "unconfigured" });
    assert.equal(called, false);
  });

  it("posts the note to Resend and treats a JSON acceptance as delivered", async () => {
    saveEnv();
    process.env.RESEND_API_KEY = "re_test_key";
    delete process.env.CONTACT_INBOX;
    delete process.env.CONTACT_FROM;
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await deliverContact(note, (url, init) => {
      calls.push({ url: String(url), init });
      return Promise.resolve(new Response(JSON.stringify({ id: "email_1" }), { status: 200 }));
    });
    assert.deepEqual(result, { ok: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.resend.com/emails");
    const headers = new Headers(calls[0].init?.headers);
    assert.equal(headers.get("authorization"), "Bearer re_test_key");
    const body = JSON.parse(String(calls[0].init?.body)) as {
      from: string;
      to: string[];
      reply_to: string;
      subject: string;
      text: string;
    };
    assert.deepEqual(body.to, [inbox]);
    assert.equal(body.from, "Tarooq <onboarding@resend.dev>");
    assert.equal(body.reply_to, "jane@example.com");
    assert.equal(body.subject, "Cloud and AI strategy");
    assert.match(body.text, /jane@example.com/);
  });

  it("reports a rejected upstream response without throwing", async () => {
    saveEnv();
    process.env.RESEND_API_KEY = "re_invalid_probe";
    const original = console.error;
    console.error = () => {};
    try {
      const result = await deliverContact(note, () =>
        Promise.resolve(
          new Response(JSON.stringify({ name: "validation_error", message: "API key is invalid" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      );
      assert.deepEqual(result, { ok: false, reason: "rejected" });
    } finally {
      console.error = original;
    }
  });

  it("reports a network failure as unreachable", async () => {
    saveEnv();
    process.env.RESEND_API_KEY = "re_test_key";
    const original = console.error;
    console.error = () => {};
    try {
      const result = await deliverContact(note, () => Promise.reject(new Error("connect ECONNREFUSED")));
      assert.deepEqual(result, { ok: false, reason: "unreachable" });
    } finally {
      console.error = original;
    }
  });
});
