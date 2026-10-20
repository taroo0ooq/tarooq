"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { languageSwitch, localizePath, stripLocale, type Locale } from "@/lib/locale";

export type NavLabels = {
  home: string;
  story: string;
  forYou: string;
  business: string;
  posts: string;
  contact: string;
  menu: string;
  close: string;
  primary: string;
};

export function Nav({
  locale,
  labels,
  darkLabel,
  lightLabel,
}: {
  locale: Locale;
  labels: NavLabels;
  darkLabel: string;
  lightLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("");
  const bare = stripLocale(pathname);
  const home = localizePath("/", locale);
  const switched = languageSwitch(pathname, hash);

  useEffect(() => {
    const read = () => setHash(window.location.hash);
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, [pathname]);

  const links = [
    { href: home, label: labels.home, isActive: bare === "/" && hash === "" },
    { href: `${home}#story`, label: labels.story, isActive: bare === "/" && hash === "#story" },
    { href: localizePath("/for-you", locale), label: labels.forYou, isActive: bare === "/for-you" },
    { href: localizePath("/business", locale), label: labels.business, isActive: bare === "/business" },
    {
      href: localizePath("/posts", locale),
      label: labels.posts,
      isActive: bare === "/posts" || (bare.startsWith("/posts/") && bare !== "/posts/new"),
    },
    { href: localizePath("/contact", locale), label: labels.contact, isActive: bare === "/contact" },
  ];

  return (
    <header className="nav">
      <Link
        href={home}
        className="brand"
        dir="ltr"
        onClick={() => {
          setOpen(false);
          setHash("");
        }}
      >
        tarooq<i>.</i>
      </Link>
      <nav id="site-nav" className={open ? "nav-links open" : "nav-links"} aria-label={labels.primary}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={link.isActive ? "active" : undefined}
            aria-current={link.isActive ? "page" : undefined}
            onClick={() => {
              setOpen(false);
              const index = link.href.indexOf("#");
              setHash(index >= 0 ? link.href.slice(index) : "");
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="nav-tools">
        <a className="lang-switch" href={switched.href} hrefLang={switched.hrefLang} lang={switched.hrefLang} aria-label={switched.ariaLabel}>
          {switched.label}
        </a>
        <ThemeToggle darkLabel={darkLabel} lightLabel={lightLabel} />
        <button
          className="nav-btn"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? labels.close : labels.menu}
        </button>
      </div>
    </header>
  );
}
