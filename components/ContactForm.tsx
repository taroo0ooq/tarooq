"use client";

import { FormEvent, useState } from "react";
import { topics } from "@/lib/content";
import type { ContactErrors } from "@/lib/contact";

const empty = { name: "", email: "", topic: topics[0], message: "", company: "", website: "" };

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
        if (next.website) {
          setFormError("Something blocked the send.");
          return;
        }
        const fieldKeys = ["name", "email", "topic", "company", "message"] as const;
        const hasFieldError = fieldKeys.some((key) => next[key]);
        if (hasFieldError) setErrors(next);
        else setFormError(next.message ?? "Something blocked the send.");
        return;
      }
      setSent(true);
    } catch {
      setFormError("The network dropped the note. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="card" role="status">
        <h2 className="serif">Received.</h2>
        <p className="status">The note is on its way.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="row">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            placeholder="Your name"
            autoComplete="name"
            value={fields.name}
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => update("name", event.target.value)}
          />
          {errors.name ? <p className="error">{errors.name}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            value={fields.email}
            aria-invalid={Boolean(errors.email)}
            onChange={(event) => update("email", event.target.value)}
          />
          {errors.email ? <p className="error">{errors.email}</p> : null}
        </div>
      </div>
      <div className="field">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          placeholder="Optional"
          autoComplete="organization"
          value={fields.company}
          aria-invalid={Boolean(errors.company)}
          onChange={(event) => update("company", event.target.value)}
        />
        {errors.company ? <p className="error">{errors.company}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="topic">Topic</label>
        <select id="topic" name="topic" value={fields.topic} onChange={(event) => update("topic", event.target.value)}>
          {topics.map((topic) => (
            <option key={topic}>{topic}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          placeholder="How can I help?"
          value={fields.message}
          aria-invalid={Boolean(errors.message)}
          onChange={(event) => update("message", event.target.value)}
        />
        {errors.message ? <p className="error">{errors.message}</p> : null}
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={fields.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </div>
      <button className="btn btn-purple" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
      {formError ? <p className="error">{formError}</p> : null}
    </form>
  );
}
