import { validateContact, type ContactInput } from "@/lib/contact";
import { deliverContact } from "@/lib/deliver";
import { turnstileRejectedMessage, turnstileVisitorIp, verifyTurnstile } from "@/lib/turnstile";

const deliveryError = "The note could not be delivered. Try again later.";
const unconfiguredError = "The mailbox is not ready to receive notes yet. Try again later.";

export async function POST(request: Request) {
  let payload: Partial<ContactInput> & { turnstileToken?: unknown };
  try {
    payload = (await request.json()) as Partial<ContactInput> & { turnstileToken?: unknown };
  } catch {
    return Response.json({ ok: false, errors: { message: "Send JSON." } }, { status: 400 });
  }

  const allowed = await verifyTurnstile(payload.turnstileToken, turnstileVisitorIp(request));
  if (!allowed) {
    return Response.json({ ok: false, errors: { message: turnstileRejectedMessage } }, { status: 400 });
  }

  const input: ContactInput = {
    name: String(payload.name ?? ""),
    email: String(payload.email ?? ""),
    topic: String(payload.topic ?? ""),
    message: String(payload.message ?? ""),
    company: String(payload.company ?? ""),
    website: String(payload.website ?? ""),
  };

  const errors = validateContact(input);
  if (Object.keys(errors).length > 0) {
    return Response.json({ ok: false, errors }, { status: 400 });
  }

  if (process.env.CONTACT_DRY_RUN === "1") {
    return Response.json({ ok: true, dryRun: true });
  }

  const result = await deliverContact({
    name: input.name,
    email: input.email,
    topic: input.topic,
    message: input.message,
    company: input.company,
  });

  if (!result.ok) {
    const unconfigured = result.reason === "unconfigured";
    return Response.json(
      { ok: false, errors: { message: unconfigured ? unconfiguredError : deliveryError } },
      { status: unconfigured ? 503 : 502 },
    );
  }

  return Response.json({ ok: true });
}
