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

export function RiyadhClock() {
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    const read = () => setHour(riyadhHour());
    read();
    const id = window.setInterval(read, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="clock" role="img" aria-label={hour == null ? "Riyadh time" : `Riyadh, ${hour}:00`}>
      <span className="clock-label">Riyadh</span>
      <div className="hours" aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => (
          <span className={index === hour ? "hour active" : "hour"} key={index} />
        ))}
      </div>
    </div>
  );
}
