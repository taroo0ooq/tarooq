/** Delivery address for the contact form. Keep this off every page. */
export const inbox = "tareq.alghazzi@outlook.com";

/** Recipient for a contact note. `CONTACT_INBOX` overrides the default. */
export function contactInbox(): string {
  const override = process.env.CONTACT_INBOX?.trim();
  return override || inbox;
}
