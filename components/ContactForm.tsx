"use client";

import { FormEvent, useState } from "react";
import { TurnstileField } from "@/components/TurnstileField";
import { translateContactError, type ContactErrorCatalog } from "@/lib/contact-i18n";
import type { ContactErrors } from "@/lib/contact";
import type { Locale } from "@/lib/locale";

export type ContactFormCopy = {
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  company: string;
  companyPlaceholder: string;
  topic: string;
  message: string;
  messagePlaceholder: string;
  website: string;
  send: string;
  sending: string;
  received: string;
  receivedNote: string;
  blocked: string;
  network: string;
  errors: ContactErrorCatalog;
};

export function ContactForm({
  locale,
  topics,
  initialTopic,
  copy,
}: {
  locale: Locale;
  topics: readonly { id: string; label: string }[];
  initialTopic?: string;
  copy: ContactFormCopy;
}) {
  const preset = topics.find((topic) => topic.id === initialTopic || topic.label === initialTopic);
  const empty = { name: "", email: "", topic: preset?.label ?? topics[0]?.label ?? "", message: "", company: "", website: "" };
  const [fields, setFields] = useState(empty);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);

  function update(key: keyof typeof empty, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function show(message: string | undefined) {
    return translateContactError(message, copy.errors, copy.blocked, locale);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setFormError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, turnstileToken }),
      });
      const data = (await response.json()) as { ok: boolean; errors?: ContactErrors };
      if (!response.ok || !data.ok) {
        const next = data.errors ?? {};
        if (next.website) {
          setFormError(copy.blocked);
          return;
        }
        const fieldKeys = ["name", "email", "topic", "company", "message"] as const;
        const hasFieldError = fieldKeys.some((key) => next[key]);
        if (hasFieldError) {
          const localized: ContactErrors = {};
          for (const key of fieldKeys) {
            if (next[key]) localized[key] = show(next[key]);
          }
          setErrors(localized);
        } else setFormError(show(next.message));
        return;
      }
      setSent(true);
    } catch {
      setFormError(copy.network);
    } finally {
      setPending(false);
      setTurnstileToken("");
      setTurnstileReset((current) => current + 1);
    }
  }

  if (sent) {
    return (
      <div className="card" role="status">
        <h2 className="serif">{copy.received}</h2>
        <p className="status">{copy.receivedNote}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="row">
        <div className="field">
          <label htmlFor="name">{copy.name}</label>
          <input
            id="name"
            name="name"
            placeholder={copy.namePlaceholder}
            autoComplete="name"
            value={fields.name}
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => update("name", event.target.value)}
          />
          {errors.name ? <p className="error">{errors.name}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="email">{copy.email}</label>
          <input
            id="email"
            name="email"
            type="email"
            dir="ltr"
            placeholder={copy.emailPlaceholder}
            autoComplete="email"
            value={fields.email}
            aria-invalid={Boolean(errors.email)}
            onChange={(event) => update("email", event.target.value)}
          />
          {errors.email ? <p className="error">{errors.email}</p> : null}
        </div>
      </div>
      <div className="field">
        <label htmlFor="company">{copy.company}</label>
        <input
          id="company"
          name="company"
          placeholder={copy.companyPlaceholder}
          autoComplete="organization"
          value={fields.company}
          aria-invalid={Boolean(errors.company)}
          onChange={(event) => update("company", event.target.value)}
        />
        {errors.company ? <p className="error">{errors.company}</p> : null}
      </div>
      <fieldset className="topic-presets">
        <legend>{copy.topic}</legend>
        {topics.map((topic) => (
          <label className={fields.topic === topic.label ? "preset on" : "preset"} key={topic.id}>
            <input
              type="radio"
              name="topic"
              value={topic.label}
              checked={fields.topic === topic.label}
              onChange={() => update("topic", topic.label)}
            />
            {topic.label}
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="message">{copy.message}</label>
        <textarea
          id="message"
          name="message"
          placeholder={copy.messagePlaceholder}
          value={fields.message}
          aria-invalid={Boolean(errors.message)}
          onChange={(event) => update("message", event.target.value)}
        />
        {errors.message ? <p className="error">{errors.message}</p> : null}
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="website">{copy.website}</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={fields.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </div>
      <TurnstileField resetKey={turnstileReset} language={locale} onToken={setTurnstileToken} />
      <button className="btn btn-purple" type="submit" disabled={pending || !turnstileToken}>
        {pending ? copy.sending : copy.send}
      </button>
      {formError ? <p className="error">{formError}</p> : null}
    </form>
  );
}
