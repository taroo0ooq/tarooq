import Image from "next/image";
import Link from "next/link";
import { RiyadhClock } from "@/components/RiyadhClock";
import { tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";
import { profilePageFor } from "@/lib/person-schema";

const tones = ["tone-soft", "tone-paper", "tone-navy"] as const;
const earlierChapterIds = new Set(["architect", "microsoft", "wires", "began"]);

function contactHref(locale: Locale, topic: string) {
  return `${localizePath("/contact", locale)}?topic=${encodeURIComponent(topic)}`;
}

export function HomePage({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const { about, certifications, credentialList, education, expertise, languages, problems, profile, roles, skills, stages, storyChapters, ui } = copy;
  const text = (value: string) => tx(locale, value);
  const recent = storyChapters.filter((chapter) => !earlierChapterIds.has(chapter.id));
  const earlier = storyChapters.filter((chapter) => earlierChapterIds.has(chapter.id));

  function Chapter({
    chapter,
    index,
    compact,
  }: {
    chapter: (typeof storyChapters)[number];
    index: number;
    compact?: boolean;
  }) {
    const chapterRoles = chapter.roleIds
      .map((id) => roles.find((role) => role.id === id))
      .filter((role) => role != null);
    return (
      <article
        className={compact ? "ch compact" : `ch ${tones[index % tones.length]}`}
        data-scene={compact ? undefined : "x"}
        data-dir={index % 2 === 0 ? "-1" : "1"}
        key={chapter.id}
      >
        <div className="yr">{chapter.year}</div>
        <div className="rail">
          <span className="dot" />
        </div>
        <div className="card-stick">
          <div className="card" data-reveal={compact ? undefined : true}>
            <small>{text(chapter.kicker)}</small>
            <h2>{text(chapter.title)}</h2>
            {chapterRoles.map((role) => (
              <div className="role" key={role.id}>
                <p className="org">{text(role.org)}</p>
                <p className="meta">
                  {text(role.title)} · {text(role.span)}, {text(role.place)}
                </p>
                <p>{text(role.summary)}</p>
                <ul>
                  {role.points.map((point) => (
                    <li key={point}>{text(point)}</li>
                  ))}
                </ul>
              </div>
            ))}
            {"showEducation" in chapter && chapter.showEducation ? (
              <div className="role">
                <p className="org">{ui.home.education}</p>
                <p className="meta">
                  {text(education.degree)} · {education.years}
                </p>
                <p>{text(education.school)}.</p>
              </div>
            ) : null}
            {chapter.tiles.length > 0 ? (
              <div className="tiles">
                {chapter.tiles.map((tile) => (
                  <div className="tile" key={tile}>
                    {text(tile)}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageFor(locale)) }} />
      <section className="hero">
        <span className="star star-a" aria-hidden="true" />
        <span className="star star-b" aria-hidden="true" />
        <div className="hero-copy">
          <p className="hero-name">{text(profile.name)}</p>
          <h1 className="serif">{text(ui.home.positioning)}</h1>
          <p className="lede">{text(ui.home.regulated)}</p>
          <p className="hero-sectors">{text(ui.home.sectors)}</p>
          <div className="hero-actions">
            <Link className="btn btn-purple" href={localizePath("/posts", locale)}>
              {ui.home.postsCta}
            </Link>
            <Link className="btn btn-ghost" href={contactHref(locale, "conversation")}>
              {ui.home.contactCta}
            </Link>
          </div>
          <RiyadhClock label={ui.clock.label} waiting={ui.clock.waiting} hourLabel={ui.clock.hour} />
        </div>
        <figure className="portrait">
          <img src="/personal-image.jpg" alt={ui.home.portraitAlt} width={397} height={400} />
        </figure>
      </section>

      <section className="cred-line" aria-label={ui.home.certsEyebrow}>
        <p className="eyebrow">{ui.home.certsEyebrow}</p>
        <ul>
          {certifications.map((item) => (
            <li key={item.name}>
              <a className="cert-link" href={item.href}>
                {item.image ? (
                  <Image src={item.image} alt="" width={48} height={48} sizes="48px" className="cert-badge cert-badge-sm" />
                ) : null}
                <span className="cert-name" dir="ltr">
                  {item.name}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="band problems" id="problems">
        <h2 className="serif">{text(problems.title)}</h2>
        <p className="band-intro">{text(problems.intro)}</p>
        <div className="problem-grid">
          {problems.items.map((item) => (
            <article className="problem-card" key={item.title}>
              <h3>{text(item.title)}</h3>
              <p>{text(item.body)}</p>
            </article>
          ))}
        </div>
        <p className="reframe">{text(problems.reframe)}</p>
      </section>

      <section className="band" id="about">
        <h2 className="serif">{ui.home.aboutTitle}</h2>
        {about.map((paragraph) => (
          <p key={paragraph}>{text(paragraph)}</p>
        ))}
      </section>

      <section className="quote">
        <div>
          &ldquo;{text(ui.quote.before)}
          <em>{text(ui.quote.em)}</em>
          {text(ui.quote.after)}&rdquo;
        </div>
      </section>

      <section className="band expertise" id="approach">
        <h2 className="serif">{ui.home.howTitle}</h2>
        <div className="expertise-grid">
          {stages.map((stage) => (
            <article className="expertise-card" key={stage.n}>
              <b className="stage-num">{stage.n}</b>
              <h3>{text(stage.title)}</h3>
              <p>{text(stage.body)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="band expertise" id="expertise">
        <p className="eyebrow">{ui.home.expertiseEyebrow}</p>
        <h2 className="serif">{ui.home.expertiseTitle}</h2>
        <p className="band-intro">{text(ui.home.expertiseIntro)}</p>
        <div className="expertise-grid">
          {expertise.map((item) => (
            <article className="expertise-card" key={item.title}>
              <h3>{text(item.title)}</h3>
              <p>{text(item.body)}</p>
            </article>
          ))}
        </div>
        <p className="meta skill-line">
          {ui.home.languagesLead} {languages.map((language) => text(language.name)).join(ui.home.languagesJoin)}. {ui.home.skillsLead}{" "}
          {skills.map((skill) => text(skill)).join(ui.home.skillsJoin)}.
        </p>
      </section>

      <section className="timeline" id="story">
        <header className="story-head">
          <p className="eyebrow">{ui.home.experience}</p>
          <h2 className="serif">{ui.home.record}</h2>
        </header>
        {recent.map((chapter, index) => (
          <Chapter chapter={chapter} index={index} key={chapter.id} />
        ))}
        <details className="earlier">
          <summary>{ui.home.earlier}</summary>
          {earlier.map((chapter, index) => (
            <Chapter chapter={chapter} compact index={index} key={chapter.id} />
          ))}
        </details>
      </section>

      <section className="cert-record" id="certificates" aria-labelledby="certificates-title">
        <header className="story-head">
          <h2 id="certificates-title" className="serif">
            {ui.home.certsListTitle}
          </h2>
        </header>
        <ul className="cert-list">
          {credentialList.map((item) => {
            const body = (
              <>
                <Image
                  src={item.image}
                  alt={item.alt}
                  width={64}
                  height={64}
                  sizes="64px"
                  loading="lazy"
                  className="cert-badge"
                />
                <span className="cert-copy">
                  <span className="cert-name" dir="ltr">
                    {item.name}
                  </span>
                  <span className="meta">
                    {item.issuer}
                    {item.issued ? ` · ${ui.home.certsIssued} ${item.issued}` : ""}
                  </span>
                </span>
              </>
            );
            return (
              <li key={item.name}>
                {item.href ? (
                  <a className="cert-row" href={item.href}>
                    {body}
                  </a>
                ) : (
                  <div className="cert-row">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
