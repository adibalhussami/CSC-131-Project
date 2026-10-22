import { BUILDINGS } from "@/lib/catalog";
import { WASTE_STREAMS, type Filter } from "@/lib/records";

// Plain GET form, so filters live in the URL just like the Spring version.
export default function FilterBar({ action, filter, drivers }: { action: string; filter: Filter; drivers: string[] }) {
  return (
    <form className="filter-bar" action={action} method="get">
      <div>
        <label htmlFor="building">Building</label>
        <select id="building" name="building" defaultValue={filter.building ?? ""}>
          <option value="">All buildings</option>
          {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="driverName">Driver</label>
        <select id="driverName" name="driverName" defaultValue={filter.driverName ?? ""}>
          <option value="">All drivers</option>
          {drivers.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="wasteStream">Waste Stream</label>
        <select id="wasteStream" name="wasteStream" defaultValue={filter.wasteStream ?? ""}>
          <option value="">All streams</option>
          {WASTE_STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="from">From</label>
        <input id="from" name="from" type="date" defaultValue={filter.from ?? ""} />
      </div>
      <div>
        <label htmlFor="to">To</label>
        <input id="to" name="to" type="date" defaultValue={filter.to ?? ""} />
      </div>
      <button type="submit">Filter</button>
    </form>
  );
}
