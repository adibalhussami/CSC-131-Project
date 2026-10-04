"use client";
import { useEffect, useState } from "react";

const TZ = "Etc/GMT+8"; // fixed UTC-8: always Pacific Standard Time, no daylight saving

export default function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <div className="clock" aria-hidden="true">&nbsp;</div>;
  const day = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "short", day: "numeric" }).format(now);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", second: "2-digit" }).format(now) + " PST";
  return <div className="clock"><b>{time}</b><span>{day}</span></div>;
}
