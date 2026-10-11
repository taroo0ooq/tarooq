"use client";

import { useState } from "react";
import { groups, projects } from "@/lib/content";

export function WorkExplorer() {
  const [group, setGroup] = useState<(typeof groups)[number]>("All");
  const visible = projects.filter((project) => group === "All" || project.group === group);

  return (
    <div>
      <div className="filters" role="toolbar" aria-label="Filter work">
        {groups.map((item) => (
          <button key={item} type="button" aria-pressed={group === item} onClick={() => setGroup(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="work-list">
        {visible.map((project) => (
          <article className="panel work-card" key={project.slug}>
            <div className="index">{project.index}</div>
            <div>
              <div className="status-row" style={{ marginTop: 0 }}>
                <span className="evidence" data-kind={project.evidence}>
                  {project.evidence}
                </span>
                <span className="chip">{project.status}</span>
                <span className="chip">{project.group}</span>
              </div>
              <h3>{project.name}</h3>
              <p>{project.summary}</p>
              <ul>
                {project.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="meta">
                {project.stack.map((item) => (
                  <span className="chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>
              <p>
                <a href={project.href}>{project.hrefLabel}</a>
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
