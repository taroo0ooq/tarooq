import type { Metadata } from "next";
import { Career } from "@/components/Career";
import { education } from "@/lib/content";

export const metadata: Metadata = {
  title: "Experience",
  description: "Career record of Tareq Al-Ghazzi, from Head of Cloud Services, MENA, back to network engineering.",
};

export default function ExperiencePage() {
  return (
    <div className="shell">
      <header className="page-hero">
        <p className="kicker">Experience</p>
        <h1>The record, in order.</h1>
        <p className="deck">
          Leadership, architecture, and the engineering years underneath them. Dates and scope follow the CV.
        </p>
      </header>
      <section>
        <Career />
      </section>
      <section>
        <p className="kicker">Education</p>
        <h2>{education.degree}</h2>
        <p className="deck">
          {education.school}
          <br />
          {education.years}
        </p>
      </section>
    </div>
  );
}
