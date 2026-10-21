import Image from "next/image";
import Link from "next/link";
import { RiyadhClock } from "@/components/RiyadhClock";
import { tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";
import { profilePageFor } from "@/lib/person-schema";

const tones = ["tone-soft", "tone-paper", "tone-navy"] as const;

export function HomePage({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const { about, approach, certifications, education, expertise, languages, profile, roles, skills, storyChapters, ui } = copy;
  const text = (value: string) => tx(locale, value);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageFor(locale)) }} />
      <section className="hero">
        <span className="star star-a" aria-hidden="true" />
        <span className="star star-b" aria-hidden="true" />
        <div className="hero-copy">
          <h1 className="serif">{text(profile.name)}</h1>
          <p className="hero-role">{text(profile.role)}</p>
          <p className="tagline">
            {text(ui.home.taglineLead)}
            <br />
            {text(ui.home.taglineRest)}
          </p>
          <p className="lede">{text(ui.home.lede)}</p>
          <div className="hero-actions">
            <a className="btn btn-purple" href="#approach">
              {ui.home.approachCta}
            </a>
            <Link className="btn btn-ghost" href={localizePath("/contact", locale)}>
              {ui.home.contactCta}
            </Link>
          </div>
          <RiyadhClock label={ui.clock.label} waiting={ui.clock.waiting} hourLabel={ui.clock.hour} />
        </div>
        <figure className="portrait">
          <img src="/personal-image.jpg" alt={ui.home.portraitAlt} width={397} height={400} />
        </figure>
      </section>

      <section className="band scene-y" id="about" data-scene="y">
        <div className="scene-stick">
          <div data-reveal>
            <h2 className="serif">{ui.home.aboutTitle}</h2>
            {about.map((paragraph) => (
              <p key={paragraph}>{text(paragraph)}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="quote scene-y" data-scene="y">
        <div className="scene-stick">
          <div data-reveal>
            &ldquo;{text(ui.quote.before)}
            <em>{text(ui.quote.em)}</em>
            {text(ui.quote.after)}&rdquo;
          </div>
        </div>
      </section>

      <section className="timeline" id="story">
        <header className="story-head scene-y" data-scene="y">
          <div className="scene-stick">
            <div data-reveal>
              <p className="eyebrow">{ui.home.experience}</p>
              <h2 className="serif">{ui.home.record}</h2>
            </div>
          </div>
        </header>
        {storyChapters.map((chapter, index) => {
          const chapterRoles = chapter.roleIds
            .map((id) => roles.find((role) => role.id === id))
            .filter((role) => role != null);
          return (
            <article className={`ch ${tones[index % tones.length]}`} data-scene="x" data-dir={index % 2 === 0 ? "-1" : "1"} key={chapter.id}>
              <div className="yr">{chapter.year}</div>
              <div className="rail">
                <span className="dot" />
              </div>
              <div className="card-stick">
                <div className="card" data-reveal>
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
        })}
      </section>

      <section className="band scene-y" id="approach" data-scene="y">
        <div className="scene-stick">
          <div data-reveal>
            <h2 className="serif">{ui.home.howTitle}</h2>
            {approach.map((paragraph) => (
              <p key={paragraph}>{text(paragraph)}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="band expertise" id="expertise" data-scene="y">
        <div data-reveal>
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
        </div>
      </section>

      <section className="creds scene-y" data-scene="y">
        <div className="scene-stick">
          <div data-reveal>
            <p className="eyebrow">{ui.home.certsEyebrow}</p>
            <h2>{ui.home.certsTitle}</h2>
            <ul className="cert-list">
              {certifications.map((item) => {
                const name = (
                  <span className="cert-name" dir="ltr">
                    {item.name}
                  </span>
                );
                if (!item.image || !item.href || !item.alt) return <li key={item.name}>{name}</li>;
                return (
                  <li key={item.name}>
                    <a className="cert-link" href={item.href}>
                      <Image src={item.image} alt={item.alt} width={600} height={600} sizes="72px" className="cert-badge" />
                      {name}
                    </a>
                  </li>
                );
              })}
            </ul>
            <p className="meta" style={{ marginTop: 18 }}>
              {ui.home.languagesLead} {languages.map((language) => text(language.name)).join(ui.home.languagesJoin)}. {ui.home.skillsLead}{" "}
              {skills.map((skill) => text(skill)).join(ui.home.skillsJoin)}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
