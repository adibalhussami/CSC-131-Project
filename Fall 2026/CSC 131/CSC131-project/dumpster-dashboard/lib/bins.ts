import { db } from "@/lib/db";
import { LOCATIONS } from "@/lib/catalog";
import { BIN_CODE, normalizeCode } from "@/lib/bin-code";

export async function findBin(code: string | undefined) {
  const c = normalizeCode(code ?? "");
  return BIN_CODE.test(c) ? db.bin.findUnique({ where: { code: c } }) : null;
}

export const locationIndex = (building: string, location: string) =>
  LOCATIONS.findIndex(l => l.building === building && l.location === location);
