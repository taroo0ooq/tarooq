import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { ChatWidgetLoader } from "@/components/ChatWidgetLoader";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getCopy } from "@/lib/copy";
import { absoluteUrl, defaultShareImage, siteUrl } from "@/lib/site";
import { themeColors, themeInitScript } from "@/lib/theme";
import "../globals.css";

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
});

const copy = getCopy("en");
const { profile, ui } = copy;

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
    images: [{ ...defaultShareImage, alt: profile.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: ui.meta.shareTitle,
    description: profile.deck,
    images: [defaultShareImage.url],
  },
};

export const viewport: Viewport = {
  themeColor: themeColors.dark,
  colorScheme: "dark light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={body.variable} suppressHydrationWarning>
      <body className={body.className}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <a className="skip" href="#content">
          {ui.skip}
        </a>
        <Nav locale="en" labels={ui.nav} darkLabel={ui.theme.dark} lightLabel={ui.theme.light} />
        <ScrollReveal />
        <main id="content">{children}</main>
        <Footer locale="en" />
        <ChatWidgetLoader locale="en" />
        <Analytics />
      </body>
    </html>
  );
}
