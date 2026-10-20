import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { profile } from "@/lib/content";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata("/contact", {
  title: "Contact",
  description: "Contact Tareq Al-Ghazzi about regional cloud strategy, FinOps, AI platforms, or governance.",
});

export default function ContactPage() {
  return (
    <section className="contact">
      <div className="contact-wrap">
        <div>
          <p className="eyebrow">Contact me</p>
          <h1 className="serif">Let&apos;s build something resilient.</h1>
          <p className="intro">
            A region, a landing zone, a cost model, or an AI platform that needs a governor. Write the context, the constraint, and what done looks like.
          </p>
          <p className="direct">
            LinkedIn: <a href={profile.linkedin}>tareq-alghazzi</a>
            <br />
            Based in {profile.location}.
          </p>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
