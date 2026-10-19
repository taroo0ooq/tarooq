"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "Home", isActive: (pathname: string, hash: string) => pathname === "/" && hash === "" },
  { href: "/#story", label: "Story", isActive: (pathname: string, hash: string) => pathname === "/" && hash === "#story" },
  { href: "/for-you", label: "For You", isActive: (pathname: string, _hash: string) => pathname === "/for-you" },
  { href: "/business", label: "Business", isActive: (pathname: string, _hash: string) => pathname === "/business" },
  { href: "/posts", label: "Posts", isActive: (pathname: string, _hash: string) => pathname === "/posts" || pathname.startsWith("/posts/") },
  { href: "/contact", label: "Contact", isActive: (pathname: string, _hash: string) => pathname === "/contact" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => setHash(window.location.hash);
    read();
    // Native hash links fire hashchange. Back/forward fires popstate.
    // Next.js client navigations use pushState and do neither, so those
    // links set the hash in their own click handlers.
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, [pathname]);

  return (
    <header className="nav">
      <Link href="/" className="brand" onClick={() => { setOpen(false); setHash(""); }}>
        tarooq<i>.</i>
      </Link>
      <nav id="site-nav" className={open ? "nav-links open" : "nav-links"} aria-label="Primary">
        {links.map((link) => {
          const active = link.isActive(pathname, hash);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "active" : undefined}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                setOpen(false);
                const index = link.href.indexOf("#");
                setHash(index >= 0 ? link.href.slice(index) : "");
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="nav-tools">
        <ThemeToggle />
        <button
          className="nav-btn"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
    </header>
  );
}
