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

export const CONTAINER_SIZES = [
  "1YD", "2YD", "3YD", "4YD", "5YD", "6YD", "8YD", "10YD", "15YD", "20YD", "25YD", "30YD", "40YD",
  "60GAL", "90GAL", "96GAL", "5x4YD", "2x3YD", "64GAL / 6YD", "6YD / 25YD / 30YD",
];

// The database has no columns for these survey answers yet, so they are saved as labeled
// lines at the top of the comments field. Swap this for real columns once the schema has them.
export function buildComments(a: { containerSize: string; serviceNotCompletedReason?: string; maintenanceIssue?: string; comments?: string }) {
  return [
    `Container: ${a.containerSize}`,
    a.serviceNotCompletedReason && `Service NOT completed: ${a.serviceNotCompletedReason}`,
    a.maintenanceIssue && `Maintenance/damage: ${a.maintenanceIssue}`,
    a.comments && `Comments: ${a.comments}`,
  ].filter(Boolean).join("\n");
}

// Reads the labeled lines written by buildComments. Records saved before the survey
// had these questions have no labels, so everything stays in `comments`.
export function parseSurveyComments(raw: string | null) {
  const out = { containerSize: undefined as string | undefined, serviceNotCompletedReason: undefined as string | undefined, maintenanceIssue: undefined as string | undefined, comments: raw ?? "" };
  if (!raw?.startsWith("Container: ")) return out;
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("Container: ")) out.containerSize = l.slice("Container: ".length);
    else if (l.startsWith("Service NOT completed: ")) out.serviceNotCompletedReason = l.slice("Service NOT completed: ".length);
    else if (l.startsWith("Maintenance/damage: ")) out.maintenanceIssue = l.slice("Maintenance/damage: ".length);
    else if (l.startsWith("Comments: ")) { out.comments = [l.slice("Comments: ".length), ...lines.slice(i + 1)].join("\n"); return out; }
  }
  out.comments = "";
  return out;
}
