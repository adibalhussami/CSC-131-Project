import { requireUser } from "@/lib/auth";
import { distinctDrivers, filterQuery, parseFilter, searchRecords, type SearchParams } from "@/lib/records";
import { shortDate } from "@/lib/time";
import { deleteRecord, importCsv } from "../actions";
import FilterBar from "../FilterBar";
import StatusChip from "../StatusChip";

export const metadata = { title: "Pickup Records" };

export default async function RecordsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireUser();
  const sp = await searchParams;
  const filter = parseFilter(sp);
  const [records, drivers] = await Promise.all([searchRecords(filter), distinctDrivers()]);
  const skipped = Number(sp.skipped) || 0;
  const returnTo = `/records${filterQuery(filter)}`;

  return (
    <main>
      <h1 className="page-title">Pickup Records</h1>
      {sp.imported !== undefined && (
        <p className="banner">
          Imported {Number(sp.imported) || 0} record(s).{skipped > 0 && ` Skipped ${skipped} row(s) that couldn't be read.`}
        </p>
      )}

      <FilterBar action="/records" filter={filter} drivers={drivers} />

      <div className="toolbar">
        {session.role === "ADMIN" && (
          <form action={importCsv} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="file" name="file" accept=".csv" required />
            <button className="btn btn-secondary" type="submit">Import CSV</button>
          </form>
        )}
        <a className="btn" href={`/records/export.csv${filterQuery(filter)}`}>Export CSV</a>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Building</th><th>Location</th><th>Bin ID</th><th>Driver</th><th>Stream</th>
              <th>Fullness</th><th>Status</th><th>Contamination</th><th>Overflow</th><th>Comments</th><th></th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className={r.overflow ? "needs-attention" : undefined}>
                <td>{shortDate(r.collectionDate)}</td>
                <td>{r.building}</td>
                <td>{r.location}</td>
                <td>{r.binId}</td>
                <td>{r.driverName}</td>
                <td>{r.wasteStream}</td>
                <td>{r.fullnessPercent}%</td>
                <td><StatusChip fullnessPercent={r.fullnessPercent} /></td>
                <td>{r.contamination}</td>
                <td>{r.overflow ? "Yes" : "No"}</td>
                <td>{r.comments}</td>
                <td>
                  <form action={deleteRecord}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" className="btn-small btn-secondary" aria-label={`Delete pickup record ${r.id}`}>Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <p className="empty-state">No pickup records match these filters.</p>}
      </div>
    </main>
  );
}
