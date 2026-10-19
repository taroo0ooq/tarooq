import type { Metadata } from "next";
import Link from "next/link";
import { businessPage, offers, steps } from "@/lib/content";

export const metadata: Metadata = {
  title: "Business",
  description: businessPage.audience,
};

export default function BusinessPage() {
  return (
    <section className="biz">
      <p className="eyebrow">For business</p>
      <h1 className="serif">Practical architecture for organizations that cannot afford failure.</h1>
      <p className="lead">{businessPage.audience}</p>
      <p className="lead biz-model">{businessPage.model}</p>
      <div className="biz-actions">
        <Link className="btn" href="/contact">
          Let&apos;s talk about the constraint
        </Link>
        <Link className="biz-text" href="/#approach">
          See how I work
        </Link>
      </div>
      <div className="offers">
        {offers.map((offer) => (
          <article className="offer" key={offer.title}>
            <div className={`top ${offer.tone}`}>
              <span>{offer.kicker}</span>
              <h2>{offer.title}</h2>
            </div>
            <div className="body">
              <p>{offer.summary}</p>
              <ul>
                {offer.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className="gets-label">What you get</p>
              <ul>
                {offer.gets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href="/contact">{offer.cta}</Link>
            </div>
          </article>
        ))}
      </div>
      <div className="biz-band">
        <h2 className="serif">{businessPage.regulatedTitle}</h2>
        <p>{businessPage.regulated}</p>
        <p className="biz-quote">
          &ldquo;Migration volume does not define maturity. Operational <em>discipline, cost transparency, and architectures</em> that survive Dev, SIT, UAT, and Production do.&rdquo;
        </p>
        <ul className="biz-list">
          {businessPage.contexts.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="biz-band">
        <h2 className="serif">{businessPage.processTitle}</h2>
        <div className="how how-plain">
          {steps.map((step) => (
            <div key={step.n}>
              <b>{step.n}</b>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
              <p className="outcome">Outcome. {step.outcome}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="biz-band">
        <h2 className="serif">{businessPage.differenceTitle}</h2>
        <ul className="biz-list">
          {businessPage.differences.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{businessPage.engagement}</p>
      </div>
      <div className="biz-band">
        <p className="biz-lead">{businessPage.credibility}</p>
        <Link className="biz-text" href="/#story">
          View the record
        </Link>
      </div>
      <div className="biz-close">
        <h2 className="serif">{businessPage.closeTitle}</h2>
        <p>{businessPage.close}</p>
        <div className="biz-actions">
          <Link className="btn" href="/contact">
            Start the conversation
          </Link>
          <Link className="biz-text" href="/#approach">
            Or see how I work
          </Link>
        </div>
      </div>
    </section>
  );
}
