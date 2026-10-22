import { WasteStream } from "@prisma/client";
import { db } from "@/lib/db";

// Used the first time the app runs, before an admin has set real rates on
// the Settings page (which writes to the CostRate table).
export const DEFAULT_COST_PER_PICKUP_USD: Record<WasteStream, number> = {
  LANDFILL: 45,
  RECYCLING: 35,
  ORGANICS: 30,
};

export async function getCostRates(): Promise<Record<WasteStream, number>> {
  const rows = await db.costRate.findMany();
  const byStream = new Map(rows.map(r => [r.wasteStream, r.usdPerPickup]));
  return {
    LANDFILL: byStream.get("LANDFILL") ?? DEFAULT_COST_PER_PICKUP_USD.LANDFILL,
    RECYCLING: byStream.get("RECYCLING") ?? DEFAULT_COST_PER_PICKUP_USD.RECYCLING,
    ORGANICS: byStream.get("ORGANICS") ?? DEFAULT_COST_PER_PICKUP_USD.ORGANICS,
  };
}

const usdFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const usd = (n: number) => usdFmt.format(n);
