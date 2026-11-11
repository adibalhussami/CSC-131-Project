import { requireFieldUser } from "@/lib/auth";
import { LOCATIONS, SERVICE_LEVELS } from "@/lib/catalog";
import { db } from "@/lib/db";
import { CONTAINER_SIZES, CONTAMINATION_LEVELS, WASTE_STREAMS, statusOf } from "@/lib/records";
import { findBin } from "@/lib/bins";
import { shortDate } from "@/lib/time";
import { createRecord } from "../../actions";
import QrScanner from "./QrScanner";
import YesNoQuestion from "./YesNoQuestion";

export const metadata = { title: "Log a Pickup" };

const STREAM_LABEL: Record<string, string> = { LANDFILL: "Landfill", RECYCLING: "Recycling", ORGANICS: "Organics" };

export default async function NewRecordPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string; bin?: string }> }) {
  const sp = await searchParams;
  const session = await requireFieldUser(sp.bin ? `/records/new?bin=${encodeURIComponent(sp.bin)}` : "/records/new");

  // QR codes on the bins link here with ?bin=CODE.
  const bin = await findBin(sp.bin);
  const lastPickup = bin
    ? await db.pickupRecord.findFirst({
      where: { OR: [{ binId: bin.code }, { location: bin.location, wasteStream: bin.wasteStream }] },
      orderBy: { collectionDate: "desc" },
    })
    : null;
  const schedule = bin ? SERVICE_LEVELS[bin.location]?.[bin.wasteStream] : undefined;
  const driverName = session.name ?? session.username;

  return (
    <main className="pickup-page">
      <h1 className="page-title">Log a Pickup</h1>
      <p className="pickup-driver">Logging as <b>{driverName}</b>{session.role !== "DRIVER" && " (staff)"}</p>

      {sp.submitted && <p className="banner">Pickup logged. Thanks! Scan the next bin when you&apos;re ready.</p>}
      {sp.error && <p className="banner banner-error">Please answer every required question.</p>}
      {sp.bin && !bin && <p className="banner banner-error">Bin {sp.bin} isn&apos;t registered yet. Fill in the details by hand, and let a supervisor know.</p>}

      <div className="scan-row"><QrScanner /></div>

      {bin && (
        <div className="card bin-card">
          <div className="bin-card-head">
            <div>
              <div className="bin-card-code">{bin.code}</div>
              <h2>{bin.building}</h2>
              <div className="bin-card-sub">{bin.location}</div>
            </div>
            <a className="btn btn-secondary btn-small" href="/records/new">Not this bin?</a>
          </div>
          <dl className="bin-card-facts">
            <div><dt>Waste stream</dt><dd>{STREAM_LABEL[bin.wasteStream]}</dd></div>
            <div><dt>Container</dt><dd>{bin.containerSize ?? "Not on file"}</dd></div>
            {schedule && <div><dt>Scheduled</dt><dd>{schedule.pickupsPerWeek}×/week</dd></div>}
            <div>
              <dt>Last pickup</dt>
              <dd>{lastPickup ? <>{shortDate(lastPickup.collectionDate)} · <span className={`status-text-${statusOf(lastPickup.fullnessPercent).toLowerCase()}`}>{lastPickup.fullnessPercent}% full</span></> : "None yet"}</dd>
            </div>
          </dl>
          {bin.notes && <p className="bin-card-notes">{bin.notes}</p>}
        </div>
      )}

      <form className="record-form" action={createRecord} key={bin?.code ?? "manual"}>
        {bin ? (
          <>
            <input type="hidden" name="binCode" value={bin.code} />
            {!bin.containerSize && <ContainerSizeField />}
          </>
        ) : (
          <>
            <div>
              <label htmlFor="location">Location</label>
              <select id="location" name="location" required defaultValue="">
                <option value="" disabled>Select a location&hellip;</option>
                {LOCATIONS.map((loc, i) => <option key={i} value={i}>{loc.building} — {loc.location}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="binId">Bin ID (optional)</label>
              <input id="binId" name="binId" type="text" placeholder="e.g. CSUS-ALP-LF-01" defaultValue={sp.bin ?? ""} />
            </div>

            <div>
              <label htmlFor="wasteStream">Waste Stream</label>
              <select id="wasteStream" name="wasteStream" required>
                {WASTE_STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <ContainerSizeField />
          </>
        )}

        <fieldset className="fullness-picker">
          <legend>How full is it?</legend>
          {[0, 25, 50, 75, 100].map(p => (
            <label key={p} className={`fullness-option fullness-${statusOf(p).toLowerCase()}`}>
              <input type="radio" name="fullnessPercent" value={p} required />
              <span>{p}%</span>
            </label>
          ))}
        </fieldset>

        <div>
          <label htmlFor="contamination">Contamination</label>
          <select id="contamination" name="contamination" required>
            {CONTAMINATION_LEVELS.map(l => <option key={l} value={l}>{l.replace("_", " ")}</option>)}
          </select>
        </div>

        <div className="checkbox-row">
          <input id="overflow" name="overflow" type="checkbox" value="true" />
          <label htmlFor="overflow" style={{ margin: 0 }}>Bin is overflowing / waste outside the bin</label>
        </div>

        <YesNoQuestion name="serviceCompleted" label="Was the service completed?" explainWhen="no" explainLabel="Why wasn't the service completed?" />

        <YesNoQuestion name="maintenance" label="Is there a maintenance issue or damaged bin?" explainWhen="yes" explainLabel="Describe the issue" />

        <div>
          <label htmlFor="comments">Comments (optional)</label>
          <textarea id="comments" name="comments" rows={3} maxLength={1000} />
        </div>

        <button className="btn" type="submit">Log Pickup</button>
      </form>
    </main>
  );
}

function ContainerSizeField() {
  return (
    <div>
      <label htmlFor="containerSize">Container Type / Size</label>
      <select id="containerSize" name="containerSize" required defaultValue="">
        <option value="" disabled>Select a size&hellip;</option>
        {CONTAINER_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}
