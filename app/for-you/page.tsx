import type { Metadata } from "next";
import { certifications, courseTopics, courses } from "@/lib/content";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata("/for-you", {
  title: "For You",
  description: "Courses and official learning paths Tareq Al-Ghazzi points people to across Azure, AWS, Google Cloud, DevOps, OpenAI, Anthropic, xAI, and agents. These are recommendations, not his certifications.",
});

export default function ForYouPage() {
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">For you</p>
        <h1 className="serif">Start where I started. Learn for free.</h1>
        <p>These are public courses I point people to. They are recommendations, not my certifications. My certificates are on the story page.</p>
      </header>
      <div className="fy-topics">
        {courseTopics.map((topic) => (
          <section className="fy-topic" key={topic.id}>
            <p className="eyebrow">{topic.title}</p>
            <h2 className="serif">{topic.line}</h2>
            <div className="fy-grid">
              {courses.filter((course) => course.topic === topic.id).map((course) => (
                <article className="fy" key={course.title}>
                  <div className={`top ${course.tone}`}>
                    <h3>{course.title}</h3>
                    <span>{course.note}</span>
                  </div>
                  <ul>
                    {course.items.map((item) => (
                      <li key={item.href}>
                        <a href={item.href}>{item.name}</a>
                        <small>{item.detail}</small>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="note">Held certificates: {certifications.join(", ")}.</p>
    </main>
  );
}
