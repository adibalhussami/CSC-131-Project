import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const s = await getSession();
  if (!s || !s.canExport) return new Response("Forbidden", { status: 403 });
  const rows = await db.collection.findMany({ include: { bin: { include: { building: true } }, driver: true }, orderBy: { collectedAt: "desc" } });
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = "date,driver,building,bin,stream,fullness,status,contaminated,overflow,damaged,comments";
  const lines = rows.map(r => [r.collectedAt.toISOString(), r.driver.name, r.bin.building.name, r.bin.binNumber, r.bin.wasteStream, r.fullness.slice(1), r.status, r.contaminated, r.overflow, r.damaged, r.comments].map(q).join(","));
  return new Response([head, ...lines].join("\n"), { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=collections.csv" } });
}
