"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { profile } from "@/lib/content";

const links = [
  { href: "/experience", label: "Experience" },
  { href: "/expertise", label: "Expertise" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="mark">T</span>
          {profile.short}
        </Link>
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <nav id="site-nav" className={open ? "nav-links open" : "nav-links"} aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className="pill" onClick={() => setOpen(false)}>
            Start a brief
          </Link>
        </nav>
      </div>
    </header>
  );
}
