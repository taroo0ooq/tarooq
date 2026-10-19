import { contactInbox } from "./inbox";

export type ContactNote = {
  name: string;
  email: string;
  topic: string;
  message: string;
  company: string;
};

const resendEndpoint = "https://api.resend.com/emails";
const defaultFrom = "Tarooq <onboarding@resend.dev>";

export type DeliverFailure = "unconfigured" | "rejected" | "unreachable";
export type DeliverResult = { ok: true } | { ok: false; reason: DeliverFailure };

export type ContactLetter = {
  from: string;
  to: string;
  subject: string;
  text: string;
  replyTo: string;
};

function contactFrom(): string {
  return process.env.CONTACT_FROM?.trim() || defaultFrom;
}

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

export function contactLetter(note: ContactNote): ContactLetter {
  const name = note.name.trim();
  const email = note.email.trim();
  const topic = note.topic.trim();
  const company = note.company.trim();
  const message = note.message.trim();
  const subject = oneLine(topic || `Note from ${name}`).slice(0, 180);
  const lines = [`Name: ${name}`, `Email: ${email}`];
  if (company) lines.push(`Company: ${company}`);
  if (topic) lines.push(`Topic: ${topic}`);
  lines.push("", message);
  return {
    from: contactFrom(),
    to: contactInbox(),
    subject,
    text: lines.join("\n"),
    replyTo: email,
  };
}

async function readResendError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown; name?: unknown };
    const name = typeof body.name === "string" ? body.name : "";
    const message = typeof body.message === "string" ? body.message : "";
    return [name, message].filter(Boolean).join(": ") || response.statusText;
  } catch {
    return response.statusText;
  }
}

/**
 * Sends a validated contact note through Resend.
 * FormSubmit's AJAX endpoint answers server fetches with a Cloudflare challenge, so it cannot deliver from Vercel.
 */
export async function deliverContact(note: ContactNote, fetchImpl: typeof fetch = fetch): Promise<DeliverResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: "unconfigured" };

  const letter = contactLetter(note);
  try {
    const response = await fetchImpl(resendEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        from: letter.from,
        to: [letter.to],
        reply_to: letter.replyTo,
        subject: letter.subject,
        text: letter.text,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      const detail = await readResendError(response);
      console.error(`Resend rejected the contact note (${response.status}): ${detail}`);
      return { ok: false, reason: "rejected" };
    }
    return { ok: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    console.error(`Resend could not be reached for the contact note: ${detail}`);
    return { ok: false, reason: "unreachable" };
  }
}
