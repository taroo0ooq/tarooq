"use client";

import { useMemo, useState } from "react";
import { eras, roles, type Era } from "@/lib/content";

export function Career() {
  const [era, setEra] = useState<(typeof eras)[number]>("All");
  const visible = useMemo(
    () => roles.filter((role) => era === "All" || role.era === era),
    [era],
  );
  const [active, setActive] = useState(roles[0].id);
  const selected = visible.find((role) => role.id === active) ?? visible[0];

  function chooseEra(next: (typeof eras)[number]) {
    setEra(next);
    const first = roles.find((role) => next === "All" || role.era === next);
    if (first) setActive(first.id);
  }

  return (
    <div>
      <div className="filters" role="toolbar" aria-label="Filter career">
        {eras.map((item) => (
          <button key={item} type="button" aria-pressed={era === item} onClick={() => chooseEra(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="board">
        <div className="domain-list" role="listbox" aria-label="Roles">
          {visible.map((role) => (
            <button
              key={role.id}
              type="button"
              role="option"
              aria-pressed={role.id === selected.id}
              onClick={() => setActive(role.id)}
            >
              {role.org}
              <small>
                {role.title} · {role.span}
              </small>
            </button>
          ))}
        </div>
        <article className="panel" aria-live="polite">
          <span className="evidence" data-kind={selected.era as Era}>
            {selected.era}
          </span>
          <h3>{selected.title}</h3>
          <p className="role-org">{selected.org}</p>
          <p className="meta-line">
            {selected.span} · {selected.place}
          </p>
          <p>{selected.summary}</p>
          <ul className="knowledge-list">
            {selected.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
