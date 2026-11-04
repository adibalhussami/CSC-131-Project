// Vercel servers run in UTC, so every date shown, grouped or filtered is
// converted to campus time explicitly.
export const TZ = "America/Los_Angeles";

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
});

function campusParts(d: Date) {
  return Object.fromEntries(partsFmt.formatToParts(d).map(p => [p.type, p.value])) as Record<string, string>;
}

// Milliseconds campus time is ahead of UTC at instant d (negative for Pacific).
function offsetMs(d: Date) {
  const p = campusParts(d);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(d.getTime() / 1000) * 1000;
}

// Campus wall-clock time -> UTC instant (two passes handle DST boundaries).
export function campusTime(y: number, mo: number, d: number, h = 0, mi = 0) {
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  const first = wall - offsetMs(new Date(wall));
  return new Date(wall - offsetMs(new Date(first)));
}

// "2026-10-08" -> start of that day on campus, or null if malformed.
export function parseDay(s: string | undefined) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  return m ? campusTime(+m[1], +m[2], +m[3]) : null;
}

// "2026-10-08 14:30" (the CSV format) -> instant, or null if malformed.
export function parseCsvDate(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/.exec(s.trim());
  return m ? campusTime(+m[1], +m[2], +m[3], +m[4], +m[5]) : null;
}

export function addDays(d: Date, n: number) {
  const p = campusParts(d);
  return campusTime(+p.year, +p.month, +p.day + n);
}

export const dayKey = (d: Date) => { const p = campusParts(d); return `${p.year}-${p.month}-${p.day}`; };
export const csvDate = (d: Date) => { const p = campusParts(d); return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`; };

const shortFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export const shortDate = (d: Date) => shortFmt.format(d); // "Oct 8, 3:05 PM"

const eyebrowFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, day: "2-digit", month: "short", year: "2-digit" });
export function eyebrowDate(d: Date) { // "08-Oct-26"
  const p = Object.fromEntries(eyebrowFmt.formatToParts(d).map(x => [x.type, x.value]));
  return `${p.day}-${p.month}-${p.year}`;
}
