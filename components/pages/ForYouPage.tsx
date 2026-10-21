import { tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import type { Locale } from "@/lib/locale";

export function ForYouPage({ locale }: { locale: Locale }) {
  const { certifications, courseTopics, courses, ui } = getCopy(locale);
  const text = (value: string) => tx(locale, value);
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">{ui.forYou.eyebrow}</p>
        <h1 className="serif">{text(ui.forYou.title)}</h1>
        <p>{text(ui.forYou.intro)}</p>
      </header>
      <div className="fy-topics">
        {courseTopics.map((topic) => (
          <section className="fy-topic" key={topic.id}>
            <p className="eyebrow">{text(topic.title)}</p>
            <h2 className="serif">{text(topic.line)}</h2>
            <div className="fy-grid">
              {courses
                .filter((course) => course.topic === topic.id)
                .map((course) => (
                  <article className="fy" key={course.title}>
                    <div className={`top ${course.tone}`}>
                      <h3 dir="ltr">{course.title}</h3>
                      <span>{text(course.note)}</span>
                    </div>
                    <ul>
                      {course.items.map((item) => (
                        <li key={item.href}>
                          <a href={item.href} dir="ltr">
                            {item.name}
                          </a>
                          <small>{text(item.detail)}</small>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
      <p className="note">
        {ui.forYou.held} {certifications.map((item) => item.name).join(", ")}.
      </p>
    </main>
  );
}
