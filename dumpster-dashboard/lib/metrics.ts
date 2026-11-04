import type { PickupRecord } from "@prisma/client";
import { needsAttention, statusOf, type FullnessStatus } from "@/lib/records";
import { dayKey } from "@/lib/time";

const TOP_PROBLEM_BUILDINGS_LIMIT = 10;
const NEEDS_ATTENTION_LIMIT = 10;

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

function groupBy<T>(xs: T[], key: (x: T) => string) {
  const m = new Map<string, T[]>();
  xs.forEach(x => { const k = key(x); m.set(k, [...(m.get(k) ?? []), x]); });
  return m;
}

// Same metrics as the Spring DashboardMetricsService. Expects records newest first.
export function computeMetrics(records: PickupRecord[]) {
  const pct = (r: PickupRecord) => r.fullnessPercent;
  const sortedEntries = <T,>(m: Map<string, T>) => [...m.entries()].sort(([a], [b]) => a.localeCompare(b));

  const statusDistribution: Partial<Record<FullnessStatus, number>> = {};
  (["GREEN", "YELLOW", "RED"] as const).forEach(s => {
    const n = records.filter(r => statusOf(r.fullnessPercent) === s).length;
    if (n) statusDistribution[s] = n;
  });

  const byDay = groupBy(records, r => dayKey(r.collectionDate));
  const problems = records.filter(needsAttention);

  return {
    totalPickups: records.length,
    averageFullness: avg(records.map(pct)),
    redCount: records.filter(r => statusOf(r.fullnessPercent) === "RED").length,
    contaminationCount: records.filter(r => r.contamination !== "NONE").length,
    overflowCount: records.filter(r => r.overflow).length,
    statusDistribution,
    averageFullnessByBuilding: Object.fromEntries(sortedEntries(groupBy(records, r => r.building)).map(([k, v]) => [k, round1(avg(v.map(pct)))])),
    fullnessTrend: Object.fromEntries(sortedEntries(byDay).map(([k, v]) => [k, round1(avg(v.map(pct)))])),
    pickupCountTrend: Object.fromEntries(sortedEntries(byDay).map(([k, v]) => [k, v.length])),
    topProblemBuildings: [...groupBy(problems, r => r.building).entries()]
      .map(([building, v]) => ({ building, problemCount: v.length }))
      .sort((a, b) => b.problemCount - a.problemCount)
      .slice(0, TOP_PROBLEM_BUILDINGS_LIMIT),
    needsAttention: problems.slice(0, NEEDS_ATTENTION_LIMIT),
  };
}
