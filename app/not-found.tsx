import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">404</p>
        <h1 className="serif">This page is not on the map.</h1>
        <p>The story is. Start again, or send a note.</p>
        <p>
          <Link className="btn btn-purple" href="/">
            Back to the story
          </Link>
        </p>
      </header>
    </main>
  );
}
