# tarooq

Personal site for tarooq. Local-first security work, native clients, and a contact page. Built for Vercel.

## Palette

Luminous Signal. Near-black ink, luminous blue (`#2f5bff`, the late-2026 / 2027 digital blue), and a chartreuse hook (`#e8ff47`) for the words and actions that should stop a scroll. Persimmon is only the live dot.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Contact relay

The form posts to `/api/contact`, which forwards the note through [FormSubmit](https://formsubmit.co) to the inbox in `lib/content.ts`. The first real submission emails that inbox a confirmation link. Until that link is opened, notes are not delivered. Set `CONTACT_DRY_RUN=1` to exercise the route without sending.

## Deploy

The project is a Next.js app. On Vercel, the framework preset is Next.js and the output is the default build (`next build`). No environment variables are required for the site to render. Leave `CONTACT_DRY_RUN` unset in production.
