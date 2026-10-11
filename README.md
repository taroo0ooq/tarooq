# Tareq Al-Ghazzi

Personal site for Tareq Al-Ghazzi, Head of Cloud Services, MENA. Content follows `Profile.pdf`.

## Run

```bash
npm install
npm run dev
```

## Contact

`/api/contact` forwards notes through FormSubmit to the address in `lib/content.ts`. The first real submission asks that inbox to confirm the relay. Set `CONTACT_DRY_RUN=1` to exercise the route without sending.

## Deploy

Next.js on Vercel. No environment variables are required for the pages to render.
