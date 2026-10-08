import { requireAdmin } from "@/lib/auth";
import { computeMetrics } from "@/lib/metrics";
import { distinctDrivers, parseFilter, searchRecords, type SearchParams } from "@/lib/records";
import { eyebrowDate, shortDate } from "@/lib/time";
import AdjustableSection, { ResetLayoutButton } from "./AdjustableSection";
import { BuildingChart, Sparkline, StatusChart, TrendChart } from "./Charts";
import FilterBar from "./FilterBar";
import StatusChip from "./StatusChip";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const filter = parseFilter(await searchParams);
  const [records, drivers] = await Promise.all([searchRecords(filter), distinctDrivers()]);
  const m = computeMetrics(records);

  const scorecard = (id: string, label: string, value: React.ReactNode, color?: string, spark?: Record<string, number>) => ({
    id, className: "card scorecard resizable",
    content: <>
      <div className="label">{label}</div>
      <div className="value" style={color ? { color } : undefined}>{value}</div>
      {spark && <Sparkline data={spark} />}
    </>,
  });
  const chartCard = (id: string, title: string, body: React.ReactNode) => ({
    id, className: "card chart-card resizable", content: <><h2>{title}</h2>{body}</>,
  });

  return (
    <main>
      <p className="page-eyebrow"><span className="dot" /><span>Data as of {eyebrowDate(new Date())}</span></p>
      <h1 className="page-title">Campus Overview</h1>

      <div className="layout-toolbar">
        <span className="layout-hint">Drag a card to rearrange it. Drag a card&apos;s bottom-right corner to resize it.</span>
        <ResetLayoutButton />
      </div>

      <FilterBar action="/" filter={filter} drivers={drivers} />

      <AdjustableSection id="scorecardsSection" sectionKey="scorecards" className="scorecards" widgets={[
        scorecard("sc-total", "Total Pickups", m.totalPickups, undefined, m.pickupCountTrend),
        scorecard("sc-fullness", "Average Fullness", `${m.averageFullness.toFixed(1)}%`, undefined, m.fullnessTrend),
        scorecard("sc-red", "Red Status", m.redCount, "var(--red)"),
        scorecard("sc-contamination", "Contamination", m.contaminationCount, "var(--yellow)"),
        scorecard("sc-overflow", "Overflow", m.overflowCount, "var(--red)"),
      ]} />

      <AdjustableSection id="chartsSection" sectionKey="charts" className="charts-grid" widgets={[
        chartCard("chart-status", "Status Breakdown", <StatusChart data={m.statusDistribution} />),
        chartCard("chart-trend", "Fullness Trend", <TrendChart data={m.fullnessTrend} />),
        chartCard("chart-building", "Average Fullness by Building", <BuildingChart data={m.averageFullnessByBuilding} />),
        chartCard("chart-topproblems", "Top Problem Buildings", <>
          <table>
            <thead><tr><th>Building</th><th>Issues</th></tr></thead>
            <tbody>
              {m.topProblemBuildings.map(b => <tr key={b.building}><td>{b.building}</td><td>{b.problemCount}</td></tr>)}
            </tbody>
          </table>
          {m.topProblemBuildings.length === 0 && <p className="empty-state">No flagged pickups yet.</p>}
        </>),
      ]} />

      <AdjustableSection id="attentionSection" sectionKey="attention" widgets={[{
        id: "needs-attention", className: "card resizable", style: { height: 320, minHeight: 160 },
        content: <>
          <h2 style={{ marginTop: 0 }}>Needs Attention</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Building</th><th>Location</th><th>Fullness</th><th>Status</th><th>Contamination</th><th>Overflow</th></tr>
              </thead>
              <tbody>
                {m.needsAttention.map(r => (
                  <tr key={r.id}>
                    <td>{shortDate(r.collectionDate)}</td>
                    <td>{r.building}</td>
                    <td>{r.location}</td>
                    <td>{r.fullnessPercent}%</td>
                    <td><StatusChip fullnessPercent={r.fullnessPercent} /></td>
                    <td>{r.contamination}</td>
                    <td>{r.overflow ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {m.needsAttention.length === 0 && <p className="empty-state">Nothing needs attention right now.</p>}
        </>,
      }]} />
    </main>
  );
}
