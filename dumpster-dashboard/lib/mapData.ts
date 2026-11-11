import type { PickupRecord, WasteStream } from "@prisma/client";
import { LOCATIONS, SERVICE_LEVELS } from "@/lib/catalog";
import { LOCATION_COORDS, type GeoPoint } from "@/lib/geo";
import { statusOf } from "@/lib/records";
import { shortDate } from "@/lib/time";

// RED = needs work now, YELLOW = keep an eye on it, GREEN = fine,
// NONE = no pickups logged for the current filters.
export type SiteSeverity = "RED" | "YELLOW" | "GREEN" | "NONE";

export type StreamSnapshot = {
  wasteStream: WasteStream;
  fullnessPercent: number;
  date: string;
  driverName: string;
  contamination: string;
  overflow: boolean;
  comments: string | null;
};

export type MapSite = GeoPoint & {
  key: string;
  building: string;
  location: string;
  severity: SiteSeverity;
  issues: string[];   // reasons the site is RED
  warnings: string[]; // reasons the site is YELLOW
  latest: StreamSnapshot[];
  pickupCount: number;
  schedule: string[];
};

const STREAM_LABEL: Record<WasteStream, string> = { LANDFILL: "Landfill", RECYCLING: "Recycling", ORGANICS: "Organics" };

// One site per catalog location. A site's state comes from the most recent
// pickup of each waste stream there, so an old problem that was logged again
// as fixed doesn't keep the pin red.
export function buildMapSites(records: PickupRecord[]): MapSite[] {
  const byLocation = new Map<string, PickupRecord[]>();
  records.forEach(r => byLocation.set(r.location, [...(byLocation.get(r.location) ?? []), r]));

  return LOCATIONS.flatMap(({ building, location }) => {
    const geo = LOCATION_COORDS[location];
    if (!geo) return [];
    const recs = (byLocation.get(location) ?? []).sort((a, b) => b.collectionDate.getTime() - a.collectionDate.getTime());

    const latestByStream = new Map<WasteStream, PickupRecord>();
    recs.forEach(r => { if (!latestByStream.has(r.wasteStream)) latestByStream.set(r.wasteStream, r); });

    const issues: string[] = [];
    const warnings: string[] = [];
    latestByStream.forEach(r => {
      const s = STREAM_LABEL[r.wasteStream];
      const status = statusOf(r.fullnessPercent);
      if (status === "RED") issues.push(`${s} is ${r.fullnessPercent}% full`);
      else if (status === "YELLOW") warnings.push(`${s} is ${r.fullnessPercent}% full`);
      if (r.overflow) issues.push(`${s} is overflowing`);
      if (r.contamination === "A_LOT") issues.push(`${s} is heavily contaminated`);
      else if (r.contamination === "A_LITTLE") warnings.push(`${s} has some contamination`);
      if (!r.serviceCompleted) issues.push(`${s} was not serviced${r.serviceNotCompletedReason ? `: ${r.serviceNotCompletedReason}` : ""}`);
      if (r.maintenanceIssue) issues.push(`${s} needs maintenance${r.maintenanceNotes ? `: ${r.maintenanceNotes}` : ""}`);
    });

    const severity: SiteSeverity = !recs.length ? "NONE" : issues.length ? "RED" : warnings.length ? "YELLOW" : "GREEN";

    const schedule = Object.entries(SERVICE_LEVELS[location] ?? {}).map(([stream, lvl]) =>
      `${STREAM_LABEL[stream as WasteStream]}: ${lvl.containerQty} container${lvl.containerQty === 1 ? "" : "s"}, ${lvl.pickupsPerWeek}×/week`);

    return [{
      ...geo,
      key: location,
      building,
      location,
      severity,
      issues,
      warnings,
      latest: [...latestByStream.values()].map(r => ({
        wasteStream: r.wasteStream,
        fullnessPercent: r.fullnessPercent,
        date: shortDate(r.collectionDate),
        driverName: r.driverName,
        contamination: r.contamination,
        overflow: r.overflow,
        comments: r.comments,
      })),
      pickupCount: recs.length,
      schedule,
    }];
  });
}
