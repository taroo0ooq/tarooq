import { ContactForm } from "@/components/ContactForm";
import { JsonLd } from "@/components/JsonLd";
import { tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import type { Locale } from "@/lib/locale";
import { pageBreadcrumbs } from "@/lib/structured-data";

export function ContactPage({ locale }: { locale: Locale }) {
  const { profile, topics, ui } = getCopy(locale);
  const text = (value: string) => tx(locale, value);
  return (
    <section className="contact">
      <JsonLd data={pageBreadcrumbs(locale, "contact", { home: ui.nav.home, current: ui.nav.contact })} />
      <div className="contact-wrap">
        <div>
          <p className="eyebrow">{ui.contact.eyebrow}</p>
          <h1 className="serif">{text(ui.contact.title)}</h1>
          <p className="intro">{text(ui.contact.intro)}</p>
          <p className="direct">
            {ui.contact.linkedin}:{" "}
            <a href={profile.linkedin} dir="ltr">
              {ui.contact.handle}
            </a>
            <br />
            {text(ui.contact.based.replace("{{location}}", profile.location))}
          </p>
        </div>
        <ContactForm locale={locale} topics={topics} copy={ui.form} />
      </div>
    </section>
  );
}
