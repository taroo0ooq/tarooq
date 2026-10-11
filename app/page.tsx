import Link from "next/link";
import { MandateBoard } from "@/components/MandateBoard";
import { convictions, profile, roles, ticker } from "@/lib/content";

export default function HomePage() {
  const loop = [...ticker, ...ticker];
  const featured = roles.slice(0, 4);

  return (
    <>
      <section className="hero shell">
        <div>
          <p className="eyebrow">
            {profile.location} · {profile.role}
          </p>
          <h1>
            Cloud is a <em>regional</em> capability.
          </h1>
          <p className="deck">{profile.deck}</p>
          <div className="actions">
            <Link className="btn btn-gold" href="/experience">
              Read the record
            </Link>
            <Link className="btn btn-ghost" href="/contact">
              Start a brief
            </Link>
          </div>
        </div>
        <aside className="now-card">
          <p className="kicker">Now</p>
          <strong>Mobiz IT</strong>
          <p>Head of Cloud Services. Regional cloud and AI strategy, FinOps, and platform governance from Riyadh.</p>
          <p className="meta-line">November 2025 — Present</p>
        </aside>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {loop.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>

      <section className="shell">
        <div className="section-head">
          <div>
            <p className="kicker">Position</p>
            <h2>Three lines I will not trade.</h2>
          </div>
        </div>
        <div className="principle-grid">
          {convictions.map((item) => (
            <article className="principle" key={item.index}>
              <div className="index">{item.index}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell">
        <div className="section-head">
          <div>
            <p className="kicker">Mandate</p>
            <h2>What the region is being built to do.</h2>
          </div>
          <p>Select a line of the current role. The detail is the work, not a slogan.</p>
        </div>
        <MandateBoard />
      </section>

      <section className="shell">
        <div className="section-head">
          <div>
            <p className="kicker">Record</p>
            <h2>Where the judgment was earned.</h2>
          </div>
          <p>
            <Link href="/experience">The full career, from regional leadership back to the network labs.</Link>
          </p>
        </div>
        <div className="card-grid">
          {featured.map((role) => (
            <Link className="card" key={role.id} href="/experience">
              <div className="index">{role.span}</div>
              <h3>{role.org}</h3>
              <p>
                {role.title}. {role.summary}
              </p>
              <span className="stretch">{role.place}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
