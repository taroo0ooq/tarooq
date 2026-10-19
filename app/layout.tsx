import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { profile } from "@/lib/content";
import "./globals.css";

const themeScript = `(function(){try{var stored=localStorage.getItem("tarooq-theme");var theme=stored==="dark"?"dark":"light";document.documentElement.setAttribute("data-theme",theme);document.documentElement.style.colorScheme=theme;var color=theme==="dark"?"#070910":"#f8f7fc";document.querySelectorAll('meta[name="theme-color"]').forEach(function(meta){meta.setAttribute("content",color);});}catch(e){}})();`;

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
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
    title: "Tareq Al-Ghazzi — I build cloud platforms that actually survive reality",
    description: profile.deck,
    type: "profile",
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
    jobTitle: profile.role,
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
    <html lang="en" className={body.variable} suppressHydrationWarning>
      <body className={body.className}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a className="skip" href="#content">
          Skip to content
        </a>
        <Nav />
        <ScrollReveal />
        <main id="content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
