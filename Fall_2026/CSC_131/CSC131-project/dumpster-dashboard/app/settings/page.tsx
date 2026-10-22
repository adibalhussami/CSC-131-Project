import { requireAdmin } from "@/lib/auth";
import { getCostRates } from "@/lib/costs";
import { WASTE_STREAMS } from "@/lib/records";
import { updateCostRates } from "../actions";

export const metadata = { title: "Settings" };

const STREAM_LABEL: Record<string, string> = { LANDFILL: "Landfill", RECYCLING: "Recycling", ORGANICS: "Organics" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const rates = await getCostRates();

  return (
    <main>
      <h1 className="page-title">Settings</h1>
      <p className="page-intro">
        Admin-only configuration for numbers the app currently has to guess at &mdash; starting
        with the per-pickup cost estimates used on the Cost page.
      </p>

      {sp.saved && <p className="banner">Rates saved.</p>}
      {sp.error && <p className="banner banner-error">Enter a valid, non-negative dollar amount for every stream.</p>}

      <div className="card" style={{ maxWidth: 480 }}>
        <h2 style={{ marginTop: 0 }}>Cost per Pickup</h2>
        <p style={{ color: "var(--muted)", marginTop: -8 }}>
          Used by the Cost page to estimate scheduled vs. actual spend. Not a real hauler
          contract &mdash; update these once the team has real numbers.
        </p>
        <form action={updateCostRates} className="record-form">
          {WASTE_STREAMS.map(stream => (
            <div key={stream}>
              <label htmlFor={`rate_${stream}`}>{STREAM_LABEL[stream] ?? stream} ($/pickup)</label>
              <input
                id={`rate_${stream}`}
                name={`rate_${stream}`}
                type="number"
                min={0}
                step="0.01"
                defaultValue={rates[stream]}
                required
              />
            </div>
          ))}
          <button className="btn" type="submit">Save Rates</button>
        </form>
      </div>
    </main>
  );
}
