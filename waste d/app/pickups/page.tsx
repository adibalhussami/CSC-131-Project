import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PCT } from "@/lib/stats";

type SP = { from?: string; to?: string; building?: string; driver?: string };
const fmt = (d: Date) => new Intl.DateTimeFormat("en-US", { timeZone: "Etc/GMT+8", dateStyle: "medium", timeStyle: "short" }).format(d) + " PST";

export default async function Pickups({ searchParams }: { searchParams: Promise<SP> }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const sp = await searchParams;
  const isDriver = s.role === "DRIVER";
  const [rows, buildings, drivers] = await Promise.all([
    db.collection.findMany({
      where: {
        collectedAt: { gte: sp.from ? new Date(sp.from) : undefined, lte: sp.to ? new Date(sp.to + "T23:59:59") : undefined },
        bin: sp.building ? { buildingId: sp.building } : undefined,
        driverId: isDriver ? s.id : sp.driver || undefined,
      },
      include: { bin: { include: { building: true } }, driver: true, photos: true },
      orderBy: { collectedAt: "desc" }, take: 200,
    }),
    db.building.findMany({ orderBy: { name: "asc" } }),
    isDriver ? Promise.resolve([]) : db.user.findMany({ where: { role: "DRIVER" }, orderBy: { name: "asc" } }),
  ]);
  return (
    <main><h1>All pickups</h1>
      <form className="filters" action="/pickups">
        <input type="date" name="from" defaultValue={sp.from} aria-label="From date" /><input type="date" name="to" defaultValue={sp.to} aria-label="To date" />
        <select name="building" defaultValue={sp.building ?? ""}><option value="">All buildings</option>{buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        {!isDriver && <select name="driver" defaultValue={sp.driver ?? ""}><option value="">All drivers</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>}
        <button>Apply filters</button>
      </form>
      <p className="sub" style={{ marginTop: 12 }}>{rows.length} record{rows.length === 1 ? "" : "s"}{rows.length === 200 ? " (showing the latest 200)" : ""}</p>
      {rows.length === 0 && <div className="card">No pickups match these filters.</div>}
      {rows.map(r => (
        <div className="card item" key={r.id}>
          <b>{r.bin.binNumber} · {r.bin.building.name}</b>
          <span className={`tag ${r.status !== "COMPLETED" || r.overflow || r.damaged ? "bad" : ""}`}>{r.overflow ? "overflow" : r.damaged ? "damaged" : r.status.toLowerCase()}</span>
          <span className="meta">{fmt(r.collectedAt)} · {r.driver.name}</span>
          <span>{PCT[r.fullness]}% full</span>
          {(r.contaminated || r.comments) && <span className="meta wide">{r.contaminated ? `Contamination: ${r.contaminationTypes.join(", ") || "yes"}. ` : ""}{r.comments}</span>}
          {r.photos.length > 0 && <div className="thumbs wide">{r.photos.map(p => <a key={p.id} href={p.url}><img src={p.url} alt="Pickup" /></a>)}</div>}
        </div>
      ))}
    </main>
  );
}
