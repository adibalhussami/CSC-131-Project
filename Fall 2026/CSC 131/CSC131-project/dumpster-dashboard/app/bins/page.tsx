import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { LOCATIONS } from "@/lib/catalog";
import { WASTE_STREAMS } from "@/lib/records";
import { createBin, deleteBin } from "../actions";
import QrCard, { QrToggle } from "./QrCard";

export const metadata = { title: "Bins & QR Codes" };

const ERRORS: Record<string, string> = {
  code: "Bin ID must be 2 to 30 letters, numbers, dots or dashes.",
  fields: "Choose a location and a waste stream.",
  exists: "That bin ID is already registered.",
};

const binLabel = (b: { building: string; location: string; wasteStream: string }) => `${b.building} — ${b.location} · ${b.wasteStream}`;

export default async function BinsPage({ searchParams }: { searchParams: Promise<{ created?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const bins = await db.bin.findMany({ orderBy: { code: "asc" } });
  const created = sp.created ? bins.find(b => b.code === sp.created) : undefined;

  return (
    <main>
      <h1 className="page-title">Bins &amp; QR Codes</h1>
      <p className="page-intro">
        Register each bin, then print its QR code and stick it on the bin. Scanning the code opens the
        pickup form with the bin&apos;s location, ID and waste stream already filled in.
      </p>
      {sp.error && <p className="banner banner-error">{ERRORS[sp.error] ?? "Couldn't save that bin."}</p>}

      <div className="bins-layout">
        <form className="record-form card" action={createBin}>
          <h2 style={{ margin: 0 }}>Add a Bin</h2>
          <div>
            <label htmlFor="code">Bin ID</label>
            <input id="code" name="code" type="text" required placeholder="e.g. CSUS-ALP-LF-01" pattern="[A-Za-z0-9._\-]{2,30}" autoCapitalize="characters" />
          </div>
          <div>
            <label htmlFor="location">Location</label>
            <select id="location" name="location" required defaultValue="">
              <option value="" disabled>Select a location&hellip;</option>
              {LOCATIONS.map((loc, i) => <option key={i} value={i}>{loc.building} — {loc.location}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="wasteStream">Waste Stream</label>
            <select id="wasteStream" name="wasteStream" required>
              {WASTE_STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="notes">Notes (optional)</label>
            <input id="notes" name="notes" type="text" maxLength={200} placeholder="e.g. North entrance, blue toter" />
          </div>
          <button className="btn" type="submit">Save Bin &amp; Create QR Code</button>
        </form>

        {created && (
          <div className="card">
            <p className="banner" style={{ marginTop: 0 }}>Bin {created.code} added. Print its QR code:</p>
            <QrCard code={created.code} label={binLabel(created)} />
          </div>
        )}
      </div>

      <div className="card table-wrap" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr><th>Bin ID</th><th>Building</th><th>Location</th><th>Stream</th><th>Notes</th><th>QR Code</th><th></th></tr>
          </thead>
          <tbody>
            {bins.map(b => (
              <tr key={b.id}>
                <td><b>{b.code}</b></td>
                <td>{b.building}</td>
                <td>{b.location}</td>
                <td>{b.wasteStream}</td>
                <td>{b.notes}</td>
                <td><QrToggle code={b.code} label={binLabel(b)} /></td>
                <td>
                  <form action={deleteBin}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className="btn btn-secondary btn-small" type="submit">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bins.length === 0 && <p className="empty-state">No bins registered yet. Add your first one above.</p>}
      </div>
    </main>
  );
}
