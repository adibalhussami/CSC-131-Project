import { getStats, count, qs, PCT, type SP } from "@/lib/stats";
import { Bars, Tabs, Filters } from "../Parts";

const SECTIONS = [
  ["building", "By building"], ["stream", "By waste stream"], ["day", "Pickups per day"],
  ["contamination", "Contamination"], ["under", "Under half full"], ["full", "Overflowing or full"], ["latest", "Latest pickups"],
] as const;

export default async function Details({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const section = SECTIONS.some(s => s[0] === sp.section) ? sp.section! : "building";
  const d = await getStats(sp);
  const title = SECTIONS.find(s => s[0] === section)![1];
  const pills = (xs: string[], cls: string, empty: string) => xs.length ? <div>{xs.map(x => <span key={x} className={`pill ${cls}`}>{x}</span>)}</div> : <p className="sub">{empty}</p>;
  return (
    <main><h1>Collection dashboard</h1>
      <Tabs active="details" sp={sp} />
      <Filters sp={{ ...sp, section }} drivers={d.drivers} action="/dashboard/details" />
      <div className="layout">
        <aside className="side">
          {SECTIONS.map(([k, label]) => <a key={k} className={k === section ? "on" : ""} href={`/dashboard/details${qs(sp, { section: k })}`}>{label}</a>)}
        </aside>
        <section className="card">
          <h2>{title}</h2>
          {section === "building" && <Bars rows={count(d.rows, r => r.bin.building.name)} />}
          {section === "stream" && <Bars rows={count(d.rows, r => r.bin.wasteStream)} />}
          {section === "day" && <Bars rows={count(d.rows, r => r.collectedAt.toISOString().slice(0, 10))} />}
          {section === "contamination" && <Bars rows={count(d.contam.flatMap(r => r.contaminationTypes), x => x)} />}
          {section === "under" && pills(d.emptyish, "", "None found. A bin needs 3 or more pickups to be flagged.")}
          {section === "full" && pills(d.fullish, "bad", "None found.")}
          {section === "latest" && (
            <div style={{ overflowX: "auto" }}><table><thead><tr><th>Date</th><th>Bin</th><th>Driver</th><th>Full</th><th>Status</th><th>Photos</th></tr></thead>
              <tbody>{d.rows.slice(-25).reverse().map(r => <tr key={r.id}><td>{r.collectedAt.toLocaleDateString()}</td><td>{r.bin.binNumber}</td><td>{r.driver.name}</td><td>{PCT[r.fullness]}%</td><td>{r.status.toLowerCase()}</td><td className="thumbs">{r.photos.map(p => <a key={p.id} href={p.url}><img src={p.url} alt="Pickup" /></a>)}</td></tr>)}</tbody></table></div>
          )}
        </section>
      </div>
    </main>
  );
}
