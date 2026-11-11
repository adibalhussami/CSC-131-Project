import { requireAdmin } from "@/lib/auth";
import { getCostRates } from "@/lib/costs";
import { db } from "@/lib/db";
import { readNewPin } from "@/lib/drivers";
import { WASTE_STREAMS } from "@/lib/records";
import { shortDate } from "@/lib/time";
import { clearData, createDriver, dismissNewPin, resetDriverPin, setDriverActive, updateCostRates } from "../actions";

export const metadata = { title: "Settings" };

const STREAM_LABEL: Record<string, string> = { LANDFILL: "Landfill", RECYCLING: "Recycling", ORGANICS: "Organics" };

type SP = { saved?: string; error?: string; driverError?: string; dataError?: string; cleared?: string };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [rates, drivers, newPin, counts] = await Promise.all([
    getCostRates(),
    db.user.findMany({
      where: { role: "DRIVER" },
      orderBy: [{ active: "desc" }, { displayName: "asc" }],
      include: { _count: { select: { pickups: true } } },
    }),
    readNewPin(),
    Promise.all([
      db.pickupRecord.count(),
      db.pickupRecord.count({ where: { isDemo: true } }),
      db.bin.count(),
      db.bin.count({ where: { isDemo: true } }),
    ]),
  ]);
  const [recordCount, demoRecordCount, binCount, demoBinCount] = counts;
  const [clearedRecords, clearedBins] = (sp.cleared ?? "").split(".").map(Number);
  const now = new Date();

  return (
    <main>
      <h1 className="page-title">Settings</h1>
      <p className="page-intro">Admin-only: driver accounts, cost estimates, and clearing out demo data.</p>

      <div className="settings-grid">
        {/* ---- Drivers ---- */}
        <section className="card settings-wide" id="drivers">
          <h2>Drivers</h2>
          <p className="settings-help">
            Each driver signs in on their phone with a username and 6-digit PIN, and stays signed in for 30 days.
            Their name is stamped on every pickup they log. Drivers can only use the pickup form and the campus map.
          </p>

          {newPin && (
            <div className="pin-reveal">
              <div>
                <div className="pin-reveal-label">Give these to the driver. The PIN won&apos;t be shown again.</div>
                <div className="pin-reveal-values">
                  <span>Username <b>{newPin.username}</b></span>
                  <span>PIN <b className="pin-digits">{newPin.pin}</b></span>
                </div>
              </div>
              <form action={dismissNewPin}><button className="btn btn-small" type="submit">Done</button></form>
            </div>
          )}
          {sp.driverError && <p className="banner banner-error">Enter the driver&apos;s name (at least 2 characters).</p>}

          <form action={createDriver} className="inline-form">
            <input name="displayName" type="text" placeholder="Driver's full name" maxLength={60} required aria-label="Driver's full name" />
            <button className="btn" type="submit">Add Driver</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Username</th><th>Status</th><th>Last sign-in</th><th>Pickups</th><th></th></tr>
              </thead>
              <tbody>
                {drivers.map(d => {
                  const locked = d.lockedUntil && d.lockedUntil > now;
                  return (
                    <tr key={d.id} className={d.active ? "" : "row-muted"}>
                      <td>{d.displayName}</td>
                      <td><code>{d.username}</code></td>
                      <td>{!d.active ? "Deactivated" : locked ? "Locked (wrong PINs)" : "Active"}</td>
                      <td>{d.lastLoginAt ? shortDate(d.lastLoginAt) : "Never"}</td>
                      <td>{d._count.pickups}</td>
                      <td className="row-actions">
                        <form action={resetDriverPin}>
                          <input type="hidden" name="id" value={d.id} />
                          <button className="btn btn-secondary btn-small" type="submit">New PIN</button>
                        </form>
                        <form action={setDriverActive}>
                          <input type="hidden" name="id" value={d.id} />
                          <input type="hidden" name="active" value={d.active ? "false" : "true"} />
                          <button className="btn btn-secondary btn-small" type="submit">{d.active ? "Deactivate" : "Reactivate"}</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {drivers.length === 0 && <p className="empty-state">No drivers yet. Add one above.</p>}
          <p className="settings-help" style={{ marginBottom: 0 }}>
            &ldquo;New PIN&rdquo; and &ldquo;Deactivate&rdquo; both sign the driver out on every phone right away.
          </p>
        </section>

        {/* ---- Cost ---- */}
        <section className="card" id="cost">
          <h2>Cost per Pickup</h2>
          <p className="settings-help">
            Used by the Cost page to estimate scheduled vs. actual spend. Not a real hauler
            contract &mdash; update these once the team has real numbers.
          </p>
          {sp.saved && <p className="banner">Rates saved.</p>}
          {sp.error && <p className="banner banner-error">Enter a valid, non-negative dollar amount for every stream.</p>}
          <form action={updateCostRates} className="record-form">
            {WASTE_STREAMS.map(stream => (
              <div key={stream}>
                <label htmlFor={`rate_${stream}`}>{STREAM_LABEL[stream] ?? stream} ($/pickup)</label>
                <input id={`rate_${stream}`} name={`rate_${stream}`} type="number" min={0} step="0.01" defaultValue={rates[stream]} required />
              </div>
            ))}
            <button className="btn" type="submit">Save Rates</button>
          </form>
        </section>

        {/* ---- Data ---- */}
        <section className="card" id="data">
          <h2>Data</h2>
          <p className="settings-help">
            {recordCount} pickup record{recordCount === 1 ? "" : "s"} ({demoRecordCount} demo) and {binCount} bin{binCount === 1 ? "" : "s"} ({demoBinCount} demo).
            Demo data is what <code>npm run seed</code> creates. Deleting can&apos;t be undone &mdash; export the records to CSV first if you might want them.
          </p>
          {sp.cleared !== undefined && (
            <p className="banner">Deleted {clearedRecords || 0} pickup record{clearedRecords === 1 ? "" : "s"} and {clearedBins || 0} bin{clearedBins === 1 ? "" : "s"}.</p>
          )}
          {sp.dataError && <p className="banner banner-error">Type DELETE in capital letters to confirm.</p>}
          <form action={clearData} className="record-form danger-form">
            <fieldset>
              <legend>What to delete</legend>
              <label className="radio-row"><input type="radio" name="scope" value="demo" defaultChecked /> Demo data only ({demoRecordCount} records, {demoBinCount} bins)</label>
              <label className="radio-row"><input type="radio" name="scope" value="records" /> All pickup records ({recordCount}), keep bins</label>
              <label className="radio-row"><input type="radio" name="scope" value="all" /> Everything: all records and all bins</label>
            </fieldset>
            <div>
              <label htmlFor="confirm">Type DELETE to confirm</label>
              <input id="confirm" name="confirm" type="text" autoComplete="off" required pattern="DELETE" />
            </div>
            <button className="btn btn-danger" type="submit">Delete</button>
          </form>
          <p className="settings-help" style={{ marginBottom: 0 }}>
            Logins, drivers and cost rates are never deleted here.
          </p>
        </section>
      </div>
    </main>
  );
}
