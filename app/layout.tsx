import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Outfit } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { profile } from "@/lib/content";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const body = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tareq Al-Ghazzi — Head of Cloud Services, MENA",
    template: "%s — Tareq Al-Ghazzi",
  },
  description: profile.deck,
  authors: [{ name: profile.name, url: profile.linkedin }],
  openGraph: {
    title: "Tareq Al-Ghazzi — Cloud is a regional capability",
    description: profile.deck,
    type: "profile",
  },
};

export const viewport: Viewport = {
  themeColor: "#071018",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    email: profile.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Riyadh",
      addressCountry: "SA",
    },
    sameAs: [profile.linkedin],
    knowsLanguage: ["English", "Arabic"],
    alumniOf: "Ajman University of Science and Technology",
  };

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a className="skip" href="#content">
          Skip to content
        </a>
        <Nav />
        <main id="content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
