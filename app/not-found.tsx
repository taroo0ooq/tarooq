import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell page-hero">
      <p className="kicker">404</p>
      <h1>This signal does not exist.</h1>
      <p className="deck">The page is missing. The work is not.</p>
      <div className="actions">
        <Link className="btn btn-signal" href="/">
          Back to the start
        </Link>
        <Link className="btn btn-ghost" href="/contact">
          Contact
        </Link>
      </div>
    </div>
  );
}
