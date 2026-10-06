import { getStats, type SP } from "@/lib/stats";
import { Tabs, Filters } from "./Parts";

export default async function Overview({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const d = await getStats(sp);
  return (
    <main><h1>Collection dashboard</h1>
      <Tabs active="overview" sp={sp} />
      <Filters sp={sp} drivers={d.drivers} action="/dashboard" />
      <div className="kpis" style={{ marginTop: 14 }}>
        <div className="kpi"><b>{d.done.length}</b>Pickups completed</div>
        <div className="kpi"><b>{d.avg}%</b>Average fullness</div>
        <div className="kpi"><b>{d.contamRate}%</b>Contamination rate</div>
        <div className="kpi"><b>{d.missed}</b>Missed, delayed or incomplete</div>
      </div>
      {d.session.canExport && <p><a href="/api/export">Export all records (CSV)</a></p>}
    </main>
  );
}
