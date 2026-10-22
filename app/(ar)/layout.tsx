import type { Metadata, Viewport } from "next";
import { Inter, Readex_Pro } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getCopy } from "@/lib/copy";
import { absoluteUrl, defaultShareImage, siteUrl } from "@/lib/site";
import { themeColors, themeInitScript } from "@/lib/theme";
import "../globals.css";

const latin = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
  preload: false,
});

const arabic = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const copy = getCopy("ar");
const { profile, ui } = copy;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: ui.meta.homeTitle,
    template: `%s — ${ui.meta.titleSuffix}`,
  },
  description: profile.deck,
  authors: [{ name: "Tareq Al-Ghazzi", url: profile.linkedin }],
  alternates: {
    canonical: absoluteUrl("/ar"),
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
    url: absoluteUrl("/ar"),
    siteName: profile.name,
    locale: "ar_SA",
    alternateLocale: ["en_US"],
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
    <html lang="ar" dir="rtl" className={`${latin.variable} ${arabic.variable}`} suppressHydrationWarning>
      <body className={arabic.className}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <a className="skip" href="#content">
          {ui.skip}
        </a>
        <Nav locale="ar" labels={ui.nav} darkLabel={ui.theme.dark} lightLabel={ui.theme.light} />
        <ScrollReveal />
        <main id="content">{children}</main>
        <Footer locale="ar" />
        <Analytics />
      </body>
    </html>
  );
}
