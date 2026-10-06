import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type SP = { from?: string; to?: string; stream?: string; driver?: string; section?: string };
export const PCT: Record<string, number> = { P0: 0, P25: 25, P50: 50, P75: 75, P100: 100 };
export const count = <T,>(xs: T[], key: (x: T) => string) => {
  const m: Record<string, number> = {};
  xs.forEach(x => { const k = key(x); m[k] = (m[k] ?? 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]) as [string, number][];
};

export async function getStats(sp: SP) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role === "DRIVER") redirect("/");
  const rows = await db.collection.findMany({
    where: {
      collectedAt: { gte: sp.from ? new Date(sp.from) : undefined, lte: sp.to ? new Date(sp.to + "T23:59:59") : undefined },
      driverId: sp.driver || undefined,
      bin: sp.stream ? { wasteStream: sp.stream as never } : undefined,
    },
    include: { bin: { include: { building: true } }, driver: true, photos: true },
    orderBy: { collectedAt: "asc" },
  });
  const drivers = await db.user.findMany({ where: { role: "DRIVER" }, orderBy: { name: "asc" } });
  const done = rows.filter(r => r.status === "COMPLETED");
  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + PCT[r.fullness], 0) / rows.length) : 0;
  const byBin: Record<string, typeof rows> = {};
  rows.forEach(r => (byBin[r.bin.binNumber] ??= []).push(r));
  const emptyish = Object.entries(byBin).filter(([, v]) => v.length >= 3 && v.filter(r => PCT[r.fullness] < 50).length / v.length >= 0.6).map(([k]) => k);
  const fullish = Object.entries(byBin).filter(([, v]) => v.filter(r => r.overflow || r.fullness === "P100").length >= 2).map(([k]) => k);
  const contam = rows.filter(r => r.contaminated);
  return { session: s, rows, drivers, done, avg, emptyish, fullish, contam, missed: rows.length - done.length, contamRate: rows.length ? Math.round((contam.length / rows.length) * 100) : 0 };
}

export function qs(sp: SP, extra: Record<string, string> = {}) {
  const p = new URLSearchParams();
  (["from", "to", "stream", "driver"] as const).forEach(k => sp[k] && p.set(k, sp[k]!));
  Object.entries(extra).forEach(([k, v]) => p.set(k, v));
  const out = p.toString();
  return out ? `?${out}` : "";
}
