import { ContaminationLevel, WasteStream, type PickupRecord, type Prisma } from "@prisma/client";
import { CONTAMINATION_LEVELS, WASTE_STREAMS } from "@/lib/records";
import { csvDate, parseCsvDate } from "@/lib/time";

// Same columns and date format ("yyyy-MM-dd HH:mm") as the Spring app, so files move between them.
export const CSV_HEADER = ["collectionDate", "building", "location", "binId", "driverName", "wasteStream", "fullnessPercent", "contamination", "overflow", "comments"];

const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;

export function recordsToCsv(records: PickupRecord[]) {
  const rows = records.map(r => [
    csvDate(r.collectionDate), r.building, r.location, r.binId ?? "", r.driverName,
    r.wasteStream, String(r.fullnessPercent), r.contamination, String(r.overflow), r.comments ?? "",
  ]);
  return [CSV_HEADER, ...rows].map(row => row.map(quote).join(",")).join("\n") + "\n";
}

// RFC 4180-style parser: quoted fields, escaped quotes, commas/newlines inside quotes, CRLF, BOM.
export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(f => f.trim()));
}

// Turns CSV rows (after the header) into records; rows that don't parse are counted as skipped.
export function csvToRecords(text: string) {
  const records: Prisma.PickupRecordCreateManyInput[] = [];
  let skipped = 0;
  for (const row of parseCsv(text).slice(1)) {
    const [date, building, location, binId, driverName, stream, fullness, contamination, overflow, comments = ""] = row.map(f => f.trim());
    const collectionDate = parseCsvDate(date ?? "");
    const fullnessPercent = Number(fullness);
    const ws = stream?.toUpperCase() as WasteStream;
    const cl = contamination?.toUpperCase() as ContaminationLevel;
    if (row.length < CSV_HEADER.length - 1 || !collectionDate || !building || !location || !driverName
      || !WASTE_STREAMS.includes(ws) || !CONTAMINATION_LEVELS.includes(cl)
      || !Number.isInteger(fullnessPercent) || fullnessPercent < 0 || fullnessPercent > 100) {
      skipped++;
      continue;
    }
    records.push({
      collectionDate, building, location, binId: binId || null, driverName, wasteStream: ws,
      fullnessPercent, contamination: cl, overflow: overflow?.toLowerCase() === "true", comments: comments.slice(0, 1000) || null,
    });
  }
  return { records, skipped };
}
