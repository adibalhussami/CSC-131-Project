import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import PickupForm from "../PickupForm";

export default async function Log({ searchParams }: { searchParams: Promise<{ bin?: string }> }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const { bin } = await searchParams; // QR codes link to /log?bin=LIB-001
  const bins = await db.bin.findMany({ where: { active: true }, include: { building: true }, orderBy: { binNumber: "asc" } });
  return (
    <main><p><a href="/">&larr; Back</a></p><h1>Log a pickup</h1>
      <div className="card"><PickupForm bins={bins.map(b => ({ n: b.binNumber, label: `${b.binNumber} · ${b.building.name} · ${b.wasteStream.toLowerCase()}` }))} initialBin={bin} /></div>
    </main>
  );
}
