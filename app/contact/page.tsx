import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { profile } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact tarooq about a vault, a native client, a pipeline, or a platform build.",
};

export default function ContactPage() {
  return (
    <div className="shell">
      <header className="page-hero">
        <p className="kicker">Contact</p>
        <h1>Say the thing.</h1>
        <p className="deck">
          A vault, a desktop client, a pipeline that should fail closed, or a platform that needs a
          harder edge. Write it down.
        </p>
      </header>
      <section className="split">
        <ContactForm />
        <div className="channels">
          <article className="channel">
            <p className="kicker">Direct</p>
            <h3>Email</h3>
            <p>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </p>
          </article>
          <article className="channel">
            <p className="kicker">Code</p>
            <h3>GitHub</h3>
            <p>
              <a href={profile.github}>{profile.handle}</a>
            </p>
          </article>
          <article className="channel">
            <p className="kicker">Good notes look like</p>
            <h3>Context, constraint, deadline.</h3>
            <p>
              What exists today, what must stay on the device, and what “done” means. A red-gate
              story is welcome.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
