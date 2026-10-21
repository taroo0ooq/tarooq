"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { chatCopy } from "@/lib/chat-copy";
import { ChatFrame, type ChatBubble } from "@/lib/chat-frame";
import { CHAT_MAX_MESSAGE_CHARS, CHAT_MAX_MESSAGES } from "@/lib/chat-limits";
import type { Locale } from "@/lib/locale";

export function ChatWidget({ locale }: { locale: Locale }) {
  const copy = chatCopy(locale);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, pending, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>("a[href], button:not(:disabled), input:not(:disabled)")];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function close() {
    setOpen(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || pending || question.length > CHAT_MAX_MESSAGE_CHARS) return;
    if (messages.length >= CHAT_MAX_MESSAGES) {
      setMessages((current) => [...current, { role: "assistant", content: copy.length }]);
      setDraft("");
      return;
    }
    const history = [...messages, { role: "user" as const, content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setPending(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Chat-Locale": locale },
        body: JSON.stringify({ locale, messages: history }),
        signal: controller.signal,
      });
      const type = response.headers.get("content-type") || "";
      if (type.includes("application/json") || !response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        replaceAssistant(data?.message || copy.error);
        return;
      }
      const reader = response.body?.getReader();
      if (!reader) {
        replaceAssistant(copy.error);
        return;
      }
      const decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const step = await reader.read();
        if (step.done) break;
        answer += decoder.decode(step.value, { stream: true });
        const snapshot = answer;
        setMessages((current) => {
          const next = [...current];
          const last = next.length - 1;
          if (last >= 0 && next[last]?.role === "assistant") next[last] = { role: "assistant", content: snapshot };
          return next;
        });
      }
      answer += decoder.decode();
      if (!answer.trim()) replaceAssistant(copy.error);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      replaceAssistant(copy.error);
    } finally {
      setPending(false);
    }
  }

  function replaceAssistant(content: string) {
    setMessages((current) => {
      const next = [...current];
      const last = next.length - 1;
      if (last >= 0 && next[last]?.role === "assistant") next[last] = { role: "assistant", content };
      else next.push({ role: "assistant", content });
      return next;
    });
  }

  return (
    <ChatFrame
      locale={locale}
      open={open}
      pending={pending}
      messages={messages}
      draft={draft}
      onDraft={setDraft}
      onToggle={() => setOpen((current) => !current)}
      onClose={close}
      onSubmit={onSubmit}
      launcherRef={launcherRef}
      panelRef={panelRef}
      inputRef={inputRef}
      logRef={logRef}
    />
  );
}
