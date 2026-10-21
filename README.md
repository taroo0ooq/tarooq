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

## Posts

Posts live in Supabase. The owner desk at `/posts/new` creates, edits, schedules, publishes, unpublishes, and deletes them. A change is visible within seconds. It does not create a Git commit, a pull request, or a Vercel rebuild.

Sign-in is the existing LinkedIn owner session. The cookie is `li_owner`, sealed with `LINKEDIN_CLIENT_SECRET` and accepted only for `LINKEDIN_PERSON_ID`. Connect LinkedIn on the desk stores that member's publishing token in the private `linkedin_connection` table and shows when it expires. LinkedIn publishing runs on the server, once per post, guarded by `linkedin_claims`.

`POST /api/posts` still accepts `Authorization: Bearer $POSTS_API_TOKEN`. It now creates a published post in Supabase.

Public pages, the sitemap, and post metadata read Supabase on each regeneration, with a 10 second cache and on-demand revalidation when the desk writes. New slugs work without a new build. If Supabase has no rows, or it cannot be reached, those pages fall back to `content/posts`. That fallback stays as an outage and pre-import safety net. After the first row exists, Supabase is the only source, so apply the seed before publishing anything new.

Images that already shipped stay in `public/posts` and keep their URLs. New covers go to the public `post-images` storage bucket. `scripts/import-posts.mjs` can repeat the seed with `SUPABASE_URL` and `SUPABASE_SECRET_KEY`; it does not upload those existing images.

Apply the SQL files in `supabase/migrations` in filename order. `npm run smoke` builds the site once, publishes a post into a local stand-in for Supabase, and checks that the new URL is live without a second build.

| Name | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | yes, for the desk | Project URL. |
| `SUPABASE_SECRET_KEY` | yes, for the desk | Server secret key (`sb_secret_`). Never expose it to the browser. |
| `LINKEDIN_CLIENT_ID` | yes, to connect | LinkedIn app. |
| `LINKEDIN_CLIENT_SECRET` | yes, to connect | Signs the owner session and encrypts the stored token. |
| `LINKEDIN_PERSON_ID` | yes, to connect | Only this member can open the desk. |
| `POSTS_API_TOKEN` | for the machine API | Bearer token for `POST /api/posts`. |

## Deploy

Next.js on Vercel. The canonical site is https://alghazzi.org. Metadata, the sitemap, robots.txt, and share links use that origin. Set `NEXT_PUBLIC_SITE_URL` to override it. `www.alghazzi.org` redirects to the apex.

The Vercel project is Git-linked to `main` and deploys only commits GitHub marks as Verified. A signed merge to `main` deploys the application. Post content itself does not go through that deploy.

The contact form is unchanged. `RESEND_API_KEY` still has to be set for Production. Changing environment variables requires a new deployment.

`.github/workflows/draft-post.yml` can still open a pull request with a Markdown draft. Those files are not the live source once Supabase has posts.
