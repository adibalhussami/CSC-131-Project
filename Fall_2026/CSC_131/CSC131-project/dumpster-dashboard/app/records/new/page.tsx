import { LOCATIONS } from "@/lib/catalog";
import { CONTAMINATION_LEVELS, WASTE_STREAMS } from "@/lib/records";
import { findBin, locationIndex } from "@/lib/bins";
import { createRecord } from "../../actions";
import QrScanner from "./QrScanner";

export const metadata = { title: "Log a Pickup" };

export default async function NewRecordPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string; bin?: string }> }) {
  const sp = await searchParams;
  // QR codes on the bins link here with ?bin=CODE.
  const bin = await findBin(sp.bin);
  const binLocation = bin ? locationIndex(bin.building, bin.location) : -1;
  return (
    <main>
      <h1 className="page-title">Log a Pickup</h1>
      {sp.submitted && <p className="banner">Pickup logged. Thanks!</p>}
      {sp.error && <p className="banner banner-error">Please fill in every required field.</p>}
      {bin && <p className="banner">Scanned bin {bin.code}: {bin.building} — {bin.location}</p>}
      {sp.bin && !bin && <p className="banner banner-error">Bin {sp.bin} isn&apos;t registered yet. Fill in the location by hand.</p>}

      <div className="scan-row"><QrScanner /></div>

      <form className="record-form" action={createRecord} key={bin?.code ?? "manual"}>
        <div>
          <label htmlFor="location">Location</label>
          <select id="location" name="location" required defaultValue={binLocation >= 0 ? String(binLocation) : ""}>
            <option value="" disabled>Select a location&hellip;</option>
            {LOCATIONS.map((loc, i) => <option key={i} value={i}>{loc.building} — {loc.location}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="binId">Bin ID (optional)</label>
          <input id="binId" name="binId" type="text" placeholder="e.g. CSUS-ALP-LF-01" defaultValue={bin?.code ?? sp.bin ?? ""} />
        </div>

        <div>
          <label htmlFor="driverName">Driver</label>
          <input id="driverName" name="driverName" type="text" required />
        </div>

        <div>
          <label htmlFor="wasteStream">Waste Stream</label>
          <select id="wasteStream" name="wasteStream" required defaultValue={bin?.wasteStream}>
            {WASTE_STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="fullnessPercent">Fullness (%)</label>
          <input id="fullnessPercent" name="fullnessPercent" type="number" min={0} max={100} required />
        </div>

        <div>
          <label htmlFor="contamination">Contamination</label>
          <select id="contamination" name="contamination" required>
            {CONTAMINATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="checkbox-row">
          <input id="overflow" name="overflow" type="checkbox" value="true" />
          <label htmlFor="overflow" style={{ margin: 0 }}>Bin is overflowing / waste outside the bin</label>
        </div>

        <div>
          <label htmlFor="comments">Comments (optional)</label>
          <textarea id="comments" name="comments" rows={3} maxLength={1000} />
        </div>

        <button className="btn" type="submit">Log Pickup</button>
      </form>
    </main>
  );
}
