import type { Metadata } from "next";
import { MandateBoard } from "@/components/MandateBoard";
import { certifications, languages, skills } from "@/lib/content";

export const metadata: Metadata = {
  title: "Expertise",
  description:
    "Cloud strategy, FinOps, landing zones, AI readiness, and security expertise of Tareq Al-Ghazzi, with certifications.",
};

export default function ExpertisePage() {
  return (
    <div className="shell">
      <header className="page-hero">
        <p className="kicker">Expertise</p>
        <h1>Judgment, with the certificates beside it.</h1>
        <p className="deck">
          Named skills from the CV, then the operating areas those skills are used for. Certifications are listed as earned, not as a substitute for the work.
        </p>
      </header>

      <section>
        <p className="kicker">Top skills</p>
        <div className="cert-grid" style={{ marginBottom: 28 }}>
          {skills.map((skill) => (
            <span className="cert" key={skill}>
              {skill}
            </span>
          ))}
        </div>
        <MandateBoard />
      </section>

      <section>
        <div className="section-head">
          <div>
            <p className="kicker">Certifications</p>
            <h2>Credentials on the record.</h2>
          </div>
        </div>
        <div className="cert-grid">
          {certifications.map((item) => (
            <article className="cert" key={item}>
              {item}
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <div>
            <p className="kicker">Languages</p>
            <h2>English and Arabic.</h2>
          </div>
        </div>
        <div className="card-grid">
          {languages.map((language) => (
            <article className="card" key={language.name}>
              <h3>{language.name}</h3>
              <p>{language.note}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
