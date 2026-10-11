import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { profile } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Tareq Al-Ghazzi about regional cloud strategy, FinOps, AI platforms, or governance.",
};

export default function ContactPage() {
  return (
    <div className="shell">
      <header className="page-hero">
        <p className="kicker">Contact</p>
        <h1>Bring the constraint.</h1>
        <p className="deck">
          A region, a landing zone, a cost model, or an AI platform that needs a governor. Write the context, the constraint, and what done looks like.
        </p>
      </header>
      <section className="split">
        <ContactForm />
        <div className="channels">
          <article className="channel">
            <p className="kicker">Email</p>
            <h3>Direct</h3>
            <p>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </p>
          </article>
          <article className="channel">
            <p className="kicker">LinkedIn</p>
            <h3>{profile.name}</h3>
            <p>
              <a href={profile.linkedin}>linkedin.com/in/tareq-alghazzi</a>
            </p>
          </article>
          <article className="channel">
            <p className="kicker">Based</p>
            <h3>{profile.location}</h3>
            <p>{profile.role}</p>
          </article>
        </div>
      </section>
    </div>
  );
}
