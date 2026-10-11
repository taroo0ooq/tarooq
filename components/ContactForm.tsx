"use client";

import { FormEvent, useState } from "react";
import { profile } from "@/lib/content";
import type { ContactErrors } from "@/lib/contact";

const empty = { name: "", email: "", topic: "", message: "", company: "" };

export function ContactForm() {
  const [fields, setFields] = useState(empty);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  function update(key: keyof typeof empty, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
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
        body: JSON.stringify(fields),
      });
      const data = (await response.json()) as { ok: boolean; errors?: ContactErrors };
      if (!response.ok || !data.ok) {
        const next = data.errors ?? {};
        const fieldKeys = ["name", "email", "topic", "company"] as const;
        const hasFieldError = fieldKeys.some((key) => next[key]) || (next.message && fields.message.trim().length < 12);
        if (hasFieldError) setErrors(next);
        else setFormError(next.message ?? "Something blocked the send.");
        return;
      }
      setSent(true);
    } catch {
      setFormError("The network dropped the note. Email directly.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="form" role="status">
        <h2 style={{ fontSize: "2.2rem" }}>Received.</h2>
        <p className="status">
          The note is on its way to {profile.email}. The first time this relay is used, FormSubmit
          sends a confirmation link to that inbox. After it is confirmed, messages arrive directly.
        </p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="name">
          <span>Name</span>
        </label>
        <input
          id="name"
          name="name"
          value={fields.name}
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          onChange={(event) => update("name", event.target.value)}
        />
        {errors.name ? <span className="error">{errors.name}</span> : null}
      </div>
      <div className="field">
        <label htmlFor="email">
          <span>Email</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={fields.email}
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          onChange={(event) => update("email", event.target.value)}
        />
        {errors.email ? <span className="error">{errors.email}</span> : null}
      </div>
      <div className="field">
        <label htmlFor="topic">
          <span>Topic</span>
        </label>
        <input
          id="topic"
          name="topic"
          value={fields.topic}
          aria-invalid={Boolean(errors.topic)}
          onChange={(event) => update("topic", event.target.value)}
        />
        {errors.topic ? <span className="error">{errors.topic}</span> : null}
      </div>
      <div className="field">
        <label htmlFor="message">
          <span>What is the mandate?</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={fields.message}
          aria-invalid={Boolean(errors.message)}
          onChange={(event) => update("message", event.target.value)}
        />
        {errors.message ? <span className="error">{errors.message}</span> : null}
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={fields.company}
          onChange={(event) => update("company", event.target.value)}
        />
      </div>
      <button className="btn btn-signal" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send the note"}
      </button>
      {formError ? <p className="error">{formError}</p> : null}
    </form>
  );
}
