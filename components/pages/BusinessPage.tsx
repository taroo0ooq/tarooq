import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";
import { pageBreadcrumbs } from "@/lib/structured-data";

function contactHref(locale: Locale, topic: string) {
  return `${localizePath("/contact", locale)}?topic=${encodeURIComponent(topic)}`;
}

export function BusinessPage({ locale }: { locale: Locale }) {
  const { businessPage, offers, stages, ui } = getCopy(locale);
  const text = (value: string) => tx(locale, value);
  const home = localizePath("/", locale);

  return (
    <section className="biz">
      <JsonLd data={pageBreadcrumbs(locale, "business", { home: ui.nav.home, current: ui.nav.business })} />
      <p className="eyebrow">{ui.business.eyebrow}</p>
      <h1 className="serif">{text(ui.business.title)}</h1>
      <p className="lead">{text(businessPage.audience)}</p>
      <p className="lead biz-model">{text(businessPage.model)}</p>
      <div className="biz-actions">
        <Link className="btn" href={contactHref(locale, "conversation")}>
          {ui.business.cta}
        </Link>
        <Link className="biz-text" href={`${home}#approach`}>
          {ui.business.seeHow}
        </Link>
      </div>
      <div className="offers">
        {offers.map((offer) => (
          <article className="offer" key={offer.id}>
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
              <Link href={contactHref(locale, offer.id)}>{text(offer.cta)}</Link>
            </div>
          </article>
        ))}
      </div>
      <div className="biz-band">
        <h2 className="serif">{text(businessPage.regulatedTitle)}</h2>
        <p>{text(businessPage.regulated)}</p>
        <ul className="biz-list">
          {businessPage.contexts.map((item) => (
            <li key={item}>{text(item)}</li>
          ))}
        </ul>
      </div>
      <div className="biz-band">
        <h2 className="serif">{text(businessPage.processTitle)}</h2>
        <div className="how how-plain">
          {stages.map((stage) => (
            <div key={stage.n}>
              <b>{stage.n}</b>
              <strong>{text(stage.title)}</strong>
              <p>{text(stage.body)}</p>
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
          <Link className="btn" href={contactHref(locale, "conversation")}>
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
