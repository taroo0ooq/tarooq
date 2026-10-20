import Link from "next/link";

export function MailLink({ href = "/contact", label = "Email" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="mail-link" aria-label={label}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 7l9 7 9-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
