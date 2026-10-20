# Tareq Al-Ghazzi

Personal site for Tareq Al-Ghazzi, Head of Cloud Services, MENA. Content follows `Profile.pdf`.

## Run

```bash
npm install
npm run dev
npm test
```

## Contact

`/api/contact` validates the note (including the honeypot), then sends it with [Resend](https://resend.com). The recipient stays on the server: `CONTACT_INBOX`, or the address in `lib/inbox.ts` when that variable is unset. The visitor's email is the reply-to address.

Set `CONTACT_DRY_RUN=1` to accept a valid note without sending.

The form delivers only after these variables are set on the Vercel project and production is redeployed:

| Name | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | API key with permission to send email. Create it at https://resend.com/api-keys. Do not commit it. |
| `CONTACT_INBOX` | no | Recipient. Defaults to the address in `lib/inbox.ts`. |
| `CONTACT_FROM` | no | Sender, as `Name <email@domain>`. Defaults to `Tarooq <onboarding@resend.dev>`. |
| `CONTACT_DRY_RUN` | no | `1` skips delivery. |

Create the Resend account with the same address that should receive notes (`tareq.alghazzi@outlook.com`, unless you set `CONTACT_INBOX`). With the default sender, Resend delivers only to the email address on that account. That is enough for this form, which only notifies that inbox.

A `vercel.app` hostname cannot be a sending domain. To send from a domain you control, verify it at https://resend.com/domains and set `CONTACT_FROM` to an address on that domain (for example `Tarooq <notes@alghazzi.org>`).

## Deploy

Next.js on Vercel. The canonical site is https://alghazzi.org. Metadata, the sitemap, robots.txt, and share links use that origin. Set `NEXT_PUBLIC_SITE_URL` to override it. `www.alghazzi.org` redirects to the apex.

Pages render with no environment variables.

The `tarooq` project is often deployed by upload, and the Git connection may be incomplete. Merging a change does not by itself update https://alghazzi.org. After `RESEND_API_KEY` is saved on Production, redeploy that project from the Vercel dashboard or the deployments API so the new route and the variable are both live. Changing environment variables requires a new deployment.
