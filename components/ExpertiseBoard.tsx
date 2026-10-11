"use client";

import { useState } from "react";
import { domains, languages } from "@/lib/content";

export function ExpertiseBoard() {
  const [active, setActive] = useState(domains[0].id);
  const [language, setLanguage] = useState(languages[0].name);
  const domain = domains.find((item) => item.id === active) ?? domains[0];
  const selectedLanguage = languages.find((item) => item.name === language) ?? languages[0];

  return (
    <div>
      <div className="board">
        <div className="domain-list" role="listbox" aria-label="Knowledge areas">
          {domains.map((item) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-pressed={item.id === domain.id}
              onClick={() => setActive(item.id)}
            >
              {item.title}
              <small>{item.evidence}</small>
            </button>
          ))}
        </div>
        <article className="panel" aria-live="polite">
          <span className="evidence" data-kind={domain.evidence}>
            {domain.evidence}
          </span>
          <h3>{domain.title}</h3>
          <p>{domain.summary}</p>
          <ul className="knowledge-list">
            {domain.knowledge.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="status-row">
            {domain.showsUpIn.map((place) => (
              <span className="chip" key={place}>
                {place}
              </span>
            ))}
          </p>
        </article>
      </div>

      <div className="section-head" style={{ marginTop: 48 }}>
        <div>
          <p className="kicker">Languages</p>
          <h2>Where it is written.</h2>
        </div>
        <p>Taken from the repositories, not from a wishlist. Select one.</p>
      </div>
      <div className="lang-cloud" role="listbox" aria-label="Languages">
        {languages.map((item) => (
          <button
            key={item.name}
            type="button"
            className="lang-chip"
            aria-pressed={item.name === selectedLanguage.name}
            onClick={() => setLanguage(item.name)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <p className="panel" style={{ marginTop: 14 }} aria-live="polite">
        <strong>{selectedLanguage.name}.</strong> {selectedLanguage.usedIn}
      </p>
    </div>
  );
}
