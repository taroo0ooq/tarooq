import Link from "next/link";
import { Console } from "@/components/Console";
import { SignalField } from "@/components/SignalField";
import { principles, profile, projects, ticker } from "@/lib/content";

export default function HomePage() {
  const loop = [...ticker, ...ticker];

  return (
    <>
      <section className="hero shell">
        <SignalField />
        <div className="hero-copy">
          <p className="eyebrow">
            <span>{profile.role}</span>
            <span>Zero-knowledge · native clients · green gates</span>
          </p>
          <h1>
            Keep the secret <em>on the device.</em>
          </h1>
          <p className="deck">{profile.deck}</p>
          <div className="actions">
            <Link className="btn btn-signal" href="/work">
              See the work
            </Link>
            <Link className="btn btn-ghost" href="/contact">
              Start a conversation
            </Link>
          </div>
          <div className="readout">
            <span>
              Signal
              <strong>Local-first security</strong>
            </span>
            <span>
              Proof
              <strong>Two vaults, one live platform</strong>
            </span>
            <span>
              Gate
              <strong>SAST and DAST fail closed</strong>
            </span>
          </div>
        </div>
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
            <p className="kicker">How the work is built</p>
            <h2>Three rules. No slide deck.</h2>
          </div>
          <p>
            {profile.name} builds software where the cryptographic core is shared, the clients stay
            thin, and a red scan blocks the merge.
          </p>
        </div>
        <div className="principle-grid">
          {principles.map((item) => (
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
            <p className="kicker">Selected work</p>
            <h2>Shipped in public.</h2>
          </div>
          <p>
            <Link href="/work">The full set, with the constraints attached.</Link>
          </p>
        </div>
        <div className="card-grid">
          {projects.map((project) => (
            <article className="card" key={project.slug}>
              <div className="index">{project.index}</div>
              <h3>{project.name}</h3>
              <p>{project.summary}</p>
              <div className="meta">
                <span className="evidence" data-kind={project.evidence}>
                  {project.status}
                </span>
                {project.stack.slice(0, 3).map((item) => (
                  <span className="chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>
              <a className="stretch" href={project.href}>
                {project.hrefLabel}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="shell">
        <div className="section-head">
          <div>
            <p className="kicker">Ask the terminal</p>
            <h2>Type into the work.</h2>
          </div>
          <p>
            A live index of the same knowledge on the expertise page. Try whoami, work, crypto, or
            contact.
          </p>
        </div>
        <Console />
        <div className="actions">
          <Link className="btn btn-ghost" href="/expertise">
            Open the full expertise map
          </Link>
        </div>
      </section>
    </>
  );
}
