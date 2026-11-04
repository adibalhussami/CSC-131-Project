import { requireUser } from "@/lib/auth";
import { computeCostMetrics } from "@/lib/costMetrics";
import { getCostRates, usd } from "@/lib/costs";
import { distinctDrivers, parseFilter, searchRecords, type SearchParams } from "@/lib/records";
import { eyebrowDate } from "@/lib/time";
import { CostComparisonChart } from "../Charts";
import FilterBar from "../FilterBar";

export default async function CostPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireUser();
  const filter = parseFilter(await searchParams);
  const [records, drivers, rates] = await Promise.all([searchRecords(filter), distinctDrivers(), getCostRates()]);
  const m = computeCostMetrics(records, filter, rates);

  return (
    <main>
      <p className="page-eyebrow"><span className="dot" /><span>Data as of {eyebrowDate(new Date())}</span></p>
      <h1 className="page-title">Cost</h1>
      <p className="page-intro">
        Estimates only &mdash; based on per-pickup rates
        {session.role === "ADMIN" ? <> set on <a href="/settings">Settings</a></> : " set by an admin"},
        not a real hauler contract. Scheduled figures assume every bin is collected on its
        listed weekly schedule over {m.weeks} week{m.weeks === 1 ? "" : "s"}.
      </p>

      <FilterBar action="/cost" filter={filter} drivers={drivers} />

      <div className="scorecards">
        <div className="card scorecard">
          <div className="label">Scheduled Cost</div>
          <div className="value">{usd(m.totalScheduledCost)}</div>
        </div>
        <div className="card scorecard">
          <div className="label">Actual Cost</div>
          <div className="value">{usd(m.totalActualCost)}</div>
        </div>
        <div className="card scorecard">
          <div className="label">Estimated Savings</div>
          <div className="value" style={{ color: m.estimatedSavings >= 0 ? "var(--green)" : "var(--red)" }}>
            {usd(m.estimatedSavings)}
          </div>
        </div>
        <div className="card scorecard">
          <div className="label">Unnecessary Pickup Cost</div>
          <div className="value" style={{ color: "var(--yellow)" }}>{usd(m.unnecessaryPickupCost)}</div>
          <div className="sub">{m.unnecessaryPickupCount} pickup{m.unnecessaryPickupCount === 1 ? "" : "s"} logged under 50% full</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h2>Scheduled vs. Actual Cost by Waste Stream</h2>
          <CostComparisonChart scheduled={m.scheduledCostByStream} actual={m.actualCostByStream} />
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cost by Building &amp; Waste Stream</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Building</th><th>Waste Stream</th><th>Containers</th>
                <th>Scheduled/wk</th><th>Scheduled Pickups</th><th>Actual Pickups</th>
                <th>Scheduled Cost</th><th>Actual Cost</th><th>Delta</th>
              </tr>
            </thead>
            <tbody>
              {m.costByBuilding.map(r => (
                <tr key={`${r.building} ${r.wasteStream}`}>
                  <td>{r.building}</td>
                  <td>{r.wasteStream}</td>
                  <td>{r.containerQty}</td>
                  <td>{r.scheduledPickupsPerWeek}</td>
                  <td>{r.scheduledPickups}</td>
                  <td>{r.actualPickups}</td>
                  <td>{usd(r.scheduledCost)}</td>
                  <td>{usd(r.actualCost)}</td>
                  <td style={{ color: r.scheduledCost - r.actualCost >= 0 ? "var(--green)" : "var(--red)" }}>
                    {usd(r.scheduledCost - r.actualCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {m.costByBuilding.length === 0 && <p className="empty-state">No scheduled service matches these filters.</p>}
      </div>
    </main>
  );
}
