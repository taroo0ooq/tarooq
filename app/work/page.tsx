import type { Metadata } from "next";
import { WorkExplorer } from "@/components/WorkExplorer";

export const metadata: Metadata = {
  title: "Work",
  description: "Public projects by tarooq: KeyVault, LocalVault, Waraq for Windows, and SyrianTalent.",
};

export default function WorkPage() {
  return (
    <div className="shell">
      <header className="page-hero">
        <p className="kicker">Work</p>
        <h1>Proof, with the constraints still on it.</h1>
        <p className="deck">
          Four public efforts. Security products are linked to their repositories. SyrianTalent is
          the one already taking traffic.
        </p>
      </header>
      <section>
        <WorkExplorer />
      </section>
    </div>
  );
}
