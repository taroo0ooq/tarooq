import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getCopy } from "@/lib/copy";
import { absoluteUrl, siteUrl } from "@/lib/site";
import "../globals.css";

const themeScript = `(function(){try{var stored=localStorage.getItem("tarooq-theme");var theme=stored==="dark"?"dark":"light";document.documentElement.setAttribute("data-theme",theme);document.documentElement.style.colorScheme=theme;var color=theme==="dark"?"#070910":"#f8f7fc";document.querySelectorAll('meta[name="theme-color"]').forEach(function(meta){meta.setAttribute("content",color);});}catch(e){}})();`;

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
});

const copy = getCopy("en");
const { profile, education, languages, ui } = copy;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: ui.meta.homeTitle,
    template: `%s — ${ui.meta.titleSuffix}`,
  },
  description: profile.deck,
  authors: [{ name: profile.name, url: profile.linkedin }],
  alternates: {
    canonical: siteUrl,
    languages: {
      en: absoluteUrl("/"),
      ar: absoluteUrl("/ar"),
      "x-default": absoluteUrl("/"),
    },
  },
  openGraph: {
    title: ui.meta.shareTitle,
    description: profile.deck,
    type: "profile",
    url: siteUrl,
    siteName: profile.name,
    locale: "en_US",
    alternateLocale: ["ar_SA"],
  },
  twitter: {
    card: "summary_large_image",
    title: ui.meta.shareTitle,
    description: profile.deck,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#070910" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: siteUrl,
    jobTitle: profile.role,
    address: {
      "@type": "PostalAddress",
      addressLocality: ui.meta.locality,
      addressCountry: "SA",
    },
    sameAs: [profile.linkedin],
    knowsLanguage: languages.map((language) => language.name),
    alumniOf: education.school,
  };

  return (
    <html lang="en" dir="ltr" className={body.variable} suppressHydrationWarning>
      <body className={body.className}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a className="skip" href="#content">
          {ui.skip}
        </a>
        <Nav locale="en" labels={ui.nav} darkLabel={ui.theme.dark} lightLabel={ui.theme.light} />
        <ScrollReveal />
        <main id="content">{children}</main>
        <Footer locale="en" />
        <Analytics />
      </body>
    </html>
  );
}
