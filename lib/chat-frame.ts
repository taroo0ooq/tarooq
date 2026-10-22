import { createElement, type FormEvent, type ReactNode, type Ref } from "react";
import { chatCopy } from "./chat-copy";
import { CHAT_MAX_MESSAGE_CHARS } from "./chat-limits";
import { chatContactHref } from "./chat-ui";
import type { Locale } from "./locale";

export type ChatBubble = { role: "user" | "assistant"; content: string };

export type ChatFrameProps = {
  locale: Locale;
  open: boolean;
  pending: boolean;
  messages: ChatBubble[];
  draft: string;
  onDraft: (value: string) => void;
  onToggle: () => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sendBlocked?: boolean;
  check?: ReactNode;
  launcherRef?: Ref<HTMLButtonElement>;
  panelRef?: Ref<HTMLDivElement>;
  inputRef?: Ref<HTMLInputElement>;
  logRef?: Ref<HTMLDivElement>;
};

export function ChatFrame(props: ChatFrameProps) {
  const copy = chatCopy(props.locale);
  const dir = props.locale === "ar" ? "rtl" : "ltr";
  const lang = props.locale;
  const launcher = createElement(
    "button",
    {
      ref: props.launcherRef,
      type: "button",
      className: "chat-launcher",
      "aria-expanded": props.open,
      "aria-controls": "chat-panel",
      "aria-label": copy.launcher,
      onClick: props.onToggle,
    },
    createElement("span", { className: "chat-launcher-dot", "aria-hidden": "true" }),
    copy.launcher,
  );

  if (!props.open) {
    return createElement("div", { className: "chat-dock", dir, lang }, launcher);
  }

  const bubbles = props.messages.map((message, index) =>
    createElement(
      "p",
      { key: `${message.role}-${index}`, className: `chat-bubble chat-bubble-${message.role}` },
      message.content || (props.pending && index === props.messages.length - 1 ? "…" : ""),
    ),
  );

  const panel = createElement(
    "div",
    {
      ref: props.panelRef,
      id: "chat-panel",
      className: "chat-panel",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "chat-title",
      "aria-describedby": "chat-hint",
    },
    createElement(
      "div",
      { className: "chat-head" },
      createElement("h2", { id: "chat-title" }, copy.title),
      createElement(
        "button",
        { type: "button", className: "chat-close", onClick: props.onClose, "aria-label": copy.close },
        "×",
      ),
    ),
    createElement("p", { id: "chat-hint", className: "chat-hint" }, copy.hint),
    createElement(
      "div",
      {
        ref: props.logRef,
        className: "chat-log",
        role: "log",
        "aria-live": "polite",
        "aria-relevant": "additions",
        "aria-busy": props.pending,
      },
      bubbles.length > 0 ? bubbles : createElement("p", { className: "chat-empty" }, copy.empty),
    ),
    props.check ? createElement("div", { className: "chat-check" }, props.check) : null,
    createElement(
      "form",
      { className: "chat-form", onSubmit: props.onSubmit },
      createElement("label", { className: "chat-sr", htmlFor: "chat-input" }, copy.placeholder),
      createElement("input", {
        ref: props.inputRef,
        id: "chat-input",
        name: "question",
        type: "text",
        value: props.draft,
        maxLength: CHAT_MAX_MESSAGE_CHARS,
        placeholder: copy.placeholder,
        autoComplete: "off",
        disabled: props.pending,
        onChange: (event: { target: { value: string } }) => props.onDraft(event.target.value),
      }),
      createElement(
        "button",
        {
          type: "submit",
          className: "chat-send",
          disabled: props.pending || props.sendBlocked || props.draft.trim().length === 0,
        },
        props.pending ? copy.sending : copy.send,
      ),
    ),
    createElement("a", { className: "chat-talk", href: chatContactHref(props.locale) }, copy.talk),
  );

  return createElement("div", { className: "chat-dock", dir, lang }, panel, launcher);
}
