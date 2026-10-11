import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell page-hero">
      <p className="kicker">404</p>
      <h1>This page is not on the map.</h1>
      <p className="deck">The record is. Start again, or send a brief.</p>
      <div className="actions">
        <Link className="btn btn-gold" href="/">
          Back to the start
        </Link>
        <Link className="btn btn-ghost" href="/contact">
          Contact
        </Link>
      </div>
    </div>
  );
}
