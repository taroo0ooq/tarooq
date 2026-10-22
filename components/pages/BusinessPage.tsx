import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";
import { pageBreadcrumbs } from "@/lib/structured-data";

export function BusinessPage({ locale }: { locale: Locale }) {
  const { businessPage, offers, steps, ui } = getCopy(locale);
  const text = (value: string) => tx(locale, value);
  const home = localizePath("/", locale);
  const contact = localizePath("/contact", locale);

  return (
    <section className="biz">
      <JsonLd data={pageBreadcrumbs(locale, "business", { home: ui.nav.home, current: ui.nav.business })} />
      <p className="eyebrow">{ui.business.eyebrow}</p>
      <h1 className="serif">{text(ui.business.title)}</h1>
      <p className="lead">{text(businessPage.audience)}</p>
      <p className="lead biz-model">{text(businessPage.model)}</p>
      <div className="biz-actions">
        <Link className="btn" href={contact}>
          {ui.business.cta}
        </Link>
        <Link className="biz-text" href={`${home}#approach`}>
          {ui.business.seeHow}
        </Link>
      </div>
      <div className="offers">
        {offers.map((offer) => (
          <article className="offer" key={offer.title}>
            <div className={`top ${offer.tone}`}>
              <span>{text(offer.kicker)}</span>
              <h2>{text(offer.title)}</h2>
            </div>
            <div className="body">
              <p>{text(offer.summary)}</p>
              <ul>
                {offer.points.map((point) => (
                  <li key={point}>{text(point)}</li>
                ))}
              </ul>
              <p className="gets-label">{ui.business.gets}</p>
              <ul>
                {offer.gets.map((item) => (
                  <li key={item}>{text(item)}</li>
                ))}
              </ul>
              <Link href={contact}>{text(offer.cta)}</Link>
            </div>
          </article>
        ))}
      </div>
      <div className="biz-band">
        <h2 className="serif">{text(businessPage.regulatedTitle)}</h2>
        <p>{text(businessPage.regulated)}</p>
        <p className="biz-quote">
          &ldquo;{text(ui.quote.before)}
          <em>{text(ui.quote.em)}</em>
          {text(ui.quote.after)}&rdquo;
        </p>
        <ul className="biz-list">
          {businessPage.contexts.map((item) => (
            <li key={item}>{text(item)}</li>
          ))}
        </ul>
      </div>
      <div className="biz-band">
        <h2 className="serif">{text(businessPage.processTitle)}</h2>
        <div className="how how-plain">
          {steps.map((step) => (
            <div key={step.n}>
              <b>{step.n}</b>
              <strong>{text(step.title)}</strong>
              <p>{text(step.body)}</p>
              <p className="outcome">
                {ui.business.outcome} {text(step.outcome)}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="biz-band">
        <h2 className="serif">{text(businessPage.differenceTitle)}</h2>
        <ul className="biz-list">
          {businessPage.differences.map((item) => (
            <li key={item}>{text(item)}</li>
          ))}
        </ul>
        <p>{text(businessPage.engagement)}</p>
      </div>
      <div className="biz-band">
        <p className="biz-lead">{text(businessPage.credibility)}</p>
        <Link className="biz-text" href={`${home}#story`}>
          {ui.business.record}
        </Link>
      </div>
      <div className="biz-close">
        <h2 className="serif">{text(businessPage.closeTitle)}</h2>
        <p>{text(businessPage.close)}</p>
        <div className="biz-actions">
          <Link className="btn" href={contact}>
            {ui.business.start}
          </Link>
          <Link className="biz-text" href={`${home}#approach`}>
            {ui.business.orHow}
          </Link>
        </div>
      </div>
    </section>
  );
}
