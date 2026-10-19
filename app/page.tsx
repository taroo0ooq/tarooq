import Link from "next/link";
import { RiyadhClock } from "@/components/RiyadhClock";
import { about, approach, certifications, education, expertise, languages, profile, roles, skills, storyChapters } from "@/lib/content";

const tones = ["tone-soft", "tone-paper", "tone-navy"] as const;

function Chapter({
  chapter,
  tone,
  index,
}: {
  chapter: (typeof storyChapters)[number];
  tone: (typeof tones)[number];
  index: number;
}) {
  const chapterRoles = chapter.roleIds.map((id) => roles.find((role) => role.id === id)).filter((role) => role != null);
  return (
    <article className={`ch ${tone}`} data-scene="x" data-dir={index % 2 === 0 ? "-1" : "1"}>
      <div className="yr">{chapter.year}</div>
      <div className="rail">
        <span className="dot" />
      </div>
      <div className="card-stick">
        <div className="card" data-reveal>
        <small>{chapter.kicker}</small>
        <h2>{chapter.title}</h2>
        {chapterRoles.map((role) => (
          <div className="role" key={role.id}>
            <p className="org">{role.org}</p>
            <p className="meta">
              {role.title} · {role.span}, {role.place}
            </p>
            <p>{role.summary}</p>
            <ul>
              {role.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
        {"showEducation" in chapter && chapter.showEducation ? (
          <div className="role">
            <p className="org">Education</p>
            <p className="meta">
              {education.degree} · {education.years}
            </p>
            <p>{education.school}.</p>
          </div>
        ) : null}
        {chapter.tiles.length > 0 ? (
          <div className="tiles">
            {chapter.tiles.map((tile) => (
              <div className="tile" key={tile}>
                {tile}
              </div>
            ))}
          </div>
        ) : null}
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <span className="star star-a" aria-hidden="true" />
        <span className="star star-b" aria-hidden="true" />
        <div className="hero-copy">
          <h1 className="serif">{profile.name}</h1>
          <p className="hero-role">{profile.role}</p>
          <p className="tagline">
            I build cloud platforms that actually survive reality.
            <br />
            Not slideware. Not best-effort. Not “it works in the lab.”
          </p>
          <p className="lede">
            Since 2001, from Abu Dhabi, UAE as network engineer and domain admin to Head of Cloud Services at Mobiz IT in Riyadh.
          </p>
          <div className="hero-actions">
            <a className="btn btn-purple" href="#approach">
              View My Approach
            </a>
            <Link className="btn btn-ghost" href="/contact">
              Get in Touch
            </Link>
          </div>
          <RiyadhClock />
        </div>
        <figure className="portrait">
          <img src="/personal-image.jpg" alt="Tareq Al-Ghazzi" width={397} height={400} />
        </figure>
      </section>

      <section className="band scene-y" id="about" data-scene="y">
        <div className="scene-stick">
          <div data-reveal>
            <h2 className="serif">About</h2>
            {about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="quote scene-y" data-scene="y">
        <div className="scene-stick">
          <div data-reveal>
            &ldquo;Migration volume does not define maturity. Operational <em>discipline, cost transparency, and architectures</em> that survive Dev, SIT, UAT, and Production do.&rdquo;
          </div>
        </div>
      </section>

      <section className="timeline" id="story">
        <header className="story-head scene-y" data-scene="y">
          <div className="scene-stick">
            <div data-reveal>
              <p className="eyebrow">Experience</p>
              <h2 className="serif">The record, newest first.</h2>
            </div>
          </div>
        </header>
        {storyChapters.map((chapter, index) => (
          <Chapter chapter={chapter} tone={tones[index % tones.length]} index={index} key={chapter.id} />
        ))}
      </section>

      <section className="band scene-y" id="approach" data-scene="y">
        <div className="scene-stick">
          <div data-reveal>
            <h2 className="serif">How I work</h2>
            {approach.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="band expertise" id="expertise" data-scene="y">
        <div data-reveal>
          <p className="eyebrow">Expertise</p>
          <h2 className="serif">Expertise</h2>
          <p className="band-intro">Practical cloud architecture and delivery for organizations that cannot afford failure or non-compliance.</p>
          <div className="expertise-grid">
            {expertise.map((item) => (
              <article className="expertise-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="creds scene-y" data-scene="y">
        <div className="scene-stick">
          <div data-reveal>
            <p className="eyebrow">Certifications</p>
            <h2>Certificates beside the work.</h2>
            <p>Named as earned on the CV. The CV does not date them, so they are not pinned to a chapter year.</p>
            <div className="badges">
              {certifications.map((item) => (
                <span className="badge" key={item}>
                  {item}
                </span>
              ))}
            </div>
            <p className="meta" style={{ marginTop: 18 }}>
              Languages: {languages.map((language) => language.name).join(" and ")}. Top skills: {skills.join(", ")}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
