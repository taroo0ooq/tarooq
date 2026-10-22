import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatFrame } from "./chat-frame.ts";
import { showChatWidget } from "./chat-ui.ts";

const noop = () => {};

function render(locale: "en" | "ar", open: boolean) {
  return renderToStaticMarkup(
    createElement(ChatFrame, {
      locale,
      open,
      pending: false,
      messages: open ? [{ role: "assistant", content: locale === "ar" ? "من الصفحات المنشورة." : "From the published pages." }] : [],
      draft: "",
      onDraft: noop,
      onToggle: noop,
      onClose: noop,
      onSubmit: (event) => event.preventDefault(),
    }),
  );
}

describe("chat widget RTL", () => {
  it("renders Arabic right to left with the Arabic contact link", () => {
    const html = render("ar", true);
    assert.match(html, /dir="rtl"/);
    assert.match(html, /lang="ar"/);
    assert.match(html, /href="\/ar\/contact"/);
    assert.match(html, /تحدث مع طارق/);
    assert.match(html, /aria-label="اسأل عن هذا الموقع"/);
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /aria-expanded="true"/);
    assert.match(html, /id="chat-input"/);
    assert.equal(html.includes('dir="ltr"'), false);
  });

  it("renders English left to right and hides the dialog until it is opened", () => {
    const closed = render("en", false);
    assert.match(closed, /dir="ltr"/);
    assert.match(closed, /Ask about this site/);
    assert.equal(closed.includes("href=\"/contact\""), false);
    assert.equal(closed.includes("role=\"dialog\""), false);
    assert.match(closed, /aria-expanded="false"/);
    const open = render("en", true);
    assert.match(open, /dir="ltr"/);
    assert.match(open, /href="\/contact"/);
    assert.match(open, /Talk to Tareq/);
    assert.match(open, /role="dialog"/);
  });

  it("holds the first question until the check is present", () => {
    const html = renderToStaticMarkup(
      createElement(ChatFrame, {
        locale: "en",
        open: true,
        pending: false,
        messages: [],
        draft: "Who is Tareq?",
        onDraft: noop,
        onToggle: noop,
        onClose: noop,
        onSubmit: (event) => event.preventDefault(),
        sendBlocked: true,
        check: createElement("div", { className: "turnstile", "data-sitekey": "test" }, "check"),
      }),
    );
    assert.match(html, /class="turnstile"/);
    assert.match(html, /disabled=""/);
    const widget = readFileSync(new URL("../components/ChatWidget.tsx", import.meta.url), "utf8");
    assert.match(widget, /TurnstileField/);
    assert.match(widget, /needsCheck/);
    assert.equal(widget.includes("TURNSTILE_SECRET_KEY"), false);
  });

  it("stays off the owner desk and is lazy loaded", () => {
    assert.equal(showChatWidget("/posts/new"), false);
    assert.equal(showChatWidget("/posts/new/"), false);
    assert.equal(showChatWidget("/ar/posts/new"), false);
    assert.equal(showChatWidget("/"), true);
    assert.equal(showChatWidget("/ar"), true);
    assert.equal(showChatWidget("/ar/business"), true);
    const loader = readFileSync(new URL("../components/ChatWidgetLoader.tsx", import.meta.url), "utf8");
    assert.match(loader, /next\/dynamic/);
    assert.match(loader, /ssr:\s*false/);
    assert.match(loader, /showChatWidget/);
    assert.match(loader, /requestIdleCallback/);
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    assert.match(css, /\.chat-dock[\s\S]*inset-inline-end:\s*16px/);
    assert.match(css, /\.chat-dock[\s\S]*align-items:\s*flex-end/);
    assert.match(css, /\.chat-panel[\s\S]*background:\s*var\(--surface\)/);
    assert.match(css, /\[data-theme="dark"\] \.chat-launcher/);
    assert.match(css, /align-self:\s*flex-end/);
  });
});
