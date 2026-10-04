import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

function startOfTodayPST() {
  const now = new Date();
  const pst = new Date(now.toLocaleString("en-US", { timeZone: "Etc/GMT+8" }));
  const since = pst.getTime() - new Date(pst).setHours(0, 0, 0, 0);
  return new Date(now.getTime() - since);
}

export default async function Home() {
  const s = await getSession();
  if (!s) redirect("/login");
  const since = startOfTodayPST();
  const [logged, photos] = await Promise.all([
    db.collection.count({ where: { driverId: s.id, collectedAt: { gte: since } } }),
    db.photo.count({ where: { collection: { driverId: s.id, collectedAt: { gte: since } } } }),
  ]);
  return (
    <main>
      <h1>Ready for your route</h1>
      <p className="sub">Tap the button to record a pickup.</p>
      {s.canSubmit ? (
        <a className="bigbtn" href="/log">
          <span className="plus"><svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" /></svg></span>
          <b>Log a pickup</b>
          <em>Scan a bin&apos;s QR code or pick from a list</em>
        </a>
      ) : (
        <div className="card">Your account can&apos;t submit pickups. Ask an admin to turn this on.</div>
      )}
      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="stat"><b>{logged}</b>Logged today</div>
        <div className="stat"><b>{photos}</b>Photos added</div>
      </div>
    </main>
  );
}
