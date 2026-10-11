"use client";

import { useState } from "react";
import { mandates } from "@/lib/content";

export function MandateBoard() {
  const [active, setActive] = useState(mandates[0].id);
  const mandate = mandates.find((item) => item.id === active) ?? mandates[0];

  return (
    <div className="board">
      <div className="domain-list" role="listbox" aria-label="Current mandate">
        {mandates.map((item) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-pressed={item.id === mandate.id}
            onClick={() => setActive(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>
      <article className="panel" aria-live="polite">
        <p className="kicker">Current mandate · Mobiz IT</p>
        <h3>{mandate.title}</h3>
        <p>{mandate.summary}</p>
        <ul className="knowledge-list">
          {mandate.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}
