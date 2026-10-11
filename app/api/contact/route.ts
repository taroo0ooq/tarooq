import { profile } from "@/lib/content";
import { validateContact, type ContactInput } from "@/lib/contact";

export async function POST(request: Request) {
  let payload: Partial<ContactInput>;
  try {
    payload = (await request.json()) as Partial<ContactInput>;
  } catch {
    return Response.json({ ok: false, errors: { message: "Send JSON." } }, { status: 400 });
  }

  const input: ContactInput = {
    name: String(payload.name ?? ""),
    email: String(payload.email ?? ""),
    topic: String(payload.topic ?? ""),
    message: String(payload.message ?? ""),
    company: String(payload.company ?? ""),
  };

  const errors = validateContact(input);
  if (Object.keys(errors).length > 0) {
    return Response.json({ ok: false, errors }, { status: 400 });
  }

  if (process.env.CONTACT_DRY_RUN === "1") {
    return Response.json({ ok: true, dryRun: true });
  }

  const subject = input.topic.trim() || `Note from ${input.name.trim()}`;
  const upstream = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(profile.email)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: input.name.trim(),
      email: input.email.trim(),
      message: input.message.trim(),
      _subject: subject,
      _template: "table",
      _captcha: "false",
    }),
  });

  if (!upstream.ok) {
    return Response.json(
      {
        ok: false,
        errors: {
          message: "The mailbox relay did not accept this note. Use email instead.",
        },
      },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
