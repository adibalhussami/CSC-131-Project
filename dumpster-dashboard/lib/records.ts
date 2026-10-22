import { ContaminationLevel, WasteStream, type PickupRecord, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { addDays, parseDay } from "@/lib/time";

export const WASTE_STREAMS = Object.values(WasteStream);
export const CONTAMINATION_LEVELS = Object.values(ContaminationLevel);

export type FullnessStatus = "GREEN" | "YELLOW" | "RED";
export function statusOf(fullnessPercent: number): FullnessStatus {
  if (fullnessPercent >= 80) return "RED";
  if (fullnessPercent >= 50) return "YELLOW";
  return "GREEN";
}

export const needsAttention = (r: PickupRecord) =>
  statusOf(r.fullnessPercent) === "RED" || r.overflow || r.contamination !== "NONE";

export type Filter = { building?: string; driverName?: string; wasteStream?: WasteStream; from?: string; to?: string };
export type SearchParams = Record<string, string | string[] | undefined>;

export function parseFilter(sp: SearchParams): Filter {
  const get = (k: string) => { const v = sp[k]; const s = (Array.isArray(v) ? v[0] : v)?.trim(); return s || undefined; };
  const stream = get("wasteStream");
  return {
    building: get("building"),
    driverName: get("driverName"),
    wasteStream: WASTE_STREAMS.includes(stream as WasteStream) ? (stream as WasteStream) : undefined,
    from: parseDay(get("from")) ? get("from") : undefined,
    to: parseDay(get("to")) ? get("to") : undefined,
  };
}

export function filterQuery(f: Filter) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => v && p.set(k, v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

function whereFor(f: Filter): Prisma.PickupRecordWhereInput {
  const from = parseDay(f.from);
  const to = parseDay(f.to);
  return {
    building: f.building,
    driverName: f.driverName,
    wasteStream: f.wasteStream,
    collectionDate: { gte: from ?? undefined, lt: to ? addDays(to, 1) : undefined },
  };
}

export function searchRecords(f: Filter) {
  return db.pickupRecord.findMany({ where: whereFor(f), orderBy: { collectionDate: "desc" } });
}

export async function distinctDrivers() {
  const rows = await db.pickupRecord.findMany({ distinct: ["driverName"], select: { driverName: true }, orderBy: { driverName: "asc" } });
  return rows.map(r => r.driverName);
}
