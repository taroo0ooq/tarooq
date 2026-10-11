import type { Metadata } from "next";
import { ExpertiseBoard } from "@/components/ExpertiseBoard";

export const metadata: Metadata = {
  title: "Expertise",
  description:
    "Knowledge map for tarooq: zero-knowledge cryptography, Rust systems, native clients, security pipelines, and Microsoft cloud.",
};

export default function ExpertisePage() {
  return (
    <div className="shell">
      <header className="page-hero">
        <p className="kicker">Expertise</p>
        <h1>What is actually known.</h1>
        <p className="deck">
          Shipped means it is in a public repository. Production means it is live. Practice means
          the work is real and the public artifact is thinner. Select a domain.
        </p>
      </header>
      <section>
        <ExpertiseBoard />
      </section>
    </div>
  );
}
