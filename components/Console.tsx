"use client";

import { FormEvent, useMemo, useState } from "react";
import { domains, profile, projects } from "@/lib/content";

const help = `commands
  whoami     identity
  work       public projects
  stack      languages and surfaces
  crypto     how the vaults lock
  contact    how to reach tarooq
  clear      wipe the screen`;

function respond(raw: string) {
  const command = raw.trim().toLowerCase();
  if (!command) return "";
  if (command === "help") return help;
  if (command === "whoami") {
    return `${profile.name}\n${profile.role}\n${profile.deck}\n${profile.github}`;
  }
  if (command === "work") {
    return projects.map((project) => `${project.name}  ${project.status}\n  ${project.href}`).join("\n\n");
  }
  if (command === "stack") {
    return domains.map((domain) => `${domain.title} [${domain.evidence}]`).join("\n");
  }
  if (command === "crypto") {
    const crypto = domains.find((domain) => domain.id === "crypto");
    return crypto ? crypto.knowledge.map((item) => `· ${item}`).join("\n") : "missing";
  }
  if (command === "contact") {
    return `email   ${profile.email}\ngithub  ${profile.github}\nform    /contact`;
  }
  if (command === "clear") return "__CLEAR__";
  return `unknown command: ${command}\ntype help`;
}

export function Console() {
  const [lines, setLines] = useState<string[]>([
    "tarooq@signal:~$ help",
    help,
  ]);
  const [value, setValue] = useState("");
  const log = useMemo(() => lines.join("\n\n"), [lines]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const output = respond(value);
    if (output === "__CLEAR__") {
      setLines(["screen cleared. type help"]);
    } else if (output) {
      setLines((current) => [...current, `tarooq@signal:~$ ${value.trim()}`, output]);
    }
    setValue("");
  }

  return (
    <section className="console" aria-label="Interactive terminal">
      <div className="console-bar">
        <span className="lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>tarooq@signal — type help</span>
      </div>
      <pre className="console-log">{log}</pre>
      <form onSubmit={onSubmit}>
        <label htmlFor="command">$</label>
        <input
          id="command"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-label="Terminal command"
          placeholder="whoami"
        />
      </form>
    </section>
  );
}
