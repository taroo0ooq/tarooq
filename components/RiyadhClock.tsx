"use client";

import { useEffect, useState } from "react";

function riyadhHour(date = new Date()) {
  const part = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: "Asia/Riyadh",
  })
    .formatToParts(date)
    .find((item) => item.type === "hour");
  return Number(part?.value ?? "0") % 24;
}

export function RiyadhClock({ label, waiting, hourLabel }: { label: string; waiting: string; hourLabel: string }) {
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    const read = () => setHour(riyadhHour());
    read();
    const id = window.setInterval(read, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="clock" role="img" aria-label={hour == null ? waiting : hourLabel.replace("{{hour}}", String(hour))}>
      <span className="clock-label">{label}</span>
      <div className="hours" aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => (
          <span className={index === hour ? "hour active" : "hour"} key={index} />
        ))}
      </div>
    </div>
  );
}
