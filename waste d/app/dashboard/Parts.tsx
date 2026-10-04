import { qs, type SP } from "@/lib/stats";

export function Bars({ rows }: { rows: [string, number][] }) {
  if (!rows.length) return <p className="sub">No records match these filters.</p>;
  const max = Math.max(1, ...rows.map(r => r[1]));
  return <div>{rows.map(([k, v]) => <div className="bar" key={k}><span>{k}</span><i style={{ width: `${(v / max) * 60}%` }} /> {v}</div>)}</div>;
}
export function Tabs({ active, sp }: { active: "overview" | "details"; sp: SP }) {
  return (
    <div className="tabs">
      <a className={active === "overview" ? "on" : ""} href={`/dashboard${qs(sp)}`}>Overview</a>
      <a className={active === "details" ? "on" : ""} href={`/dashboard/details${qs(sp)}`}>Details</a>
    </div>
  );
}
export function Filters({ sp, drivers, action }: { sp: SP; drivers: { id: string; name: string }[]; action: string }) {
  return (
    <form className="filters" action={action}>
      {sp.section && <input type="hidden" name="section" value={sp.section} />}
      <input type="date" name="from" defaultValue={sp.from} aria-label="From date" /><input type="date" name="to" defaultValue={sp.to} aria-label="To date" />
      <select name="stream" defaultValue={sp.stream ?? ""}><option value="">All streams</option>{["TRASH", "RECYCLING", "COMPOST", "CARDBOARD", "OTHER"].map(x => <option key={x}>{x}</option>)}</select>
      <select name="driver" defaultValue={sp.driver ?? ""}><option value="">All drivers</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
      <button>Apply filters</button>
    </form>
  );
}
