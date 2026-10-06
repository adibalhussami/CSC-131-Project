import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import AdminClient from "./AdminClient";
import BinsClient from "./BinsClient";

const ROLE_LABEL: Record<string, string> = { DRIVER: "Driver", SUSTAINABILITY: "Sustainability staff", SUPERVISOR: "Supervisor", ADMIN: "Admin" };

export default async function Admin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "ADMIN") redirect("/");
  const t = (await searchParams).tab;
  const tab = t === "bins" ? "bins" : t === "permissions" ? "permissions" : "users";
  return (
    <main><h1>Admin</h1>
      <div className="tabs">
        <a className={tab === "users" ? "on" : ""} href="/admin">Users</a>
        <a className={tab === "bins" ? "on" : ""} href="/admin?tab=bins">Bins and QR codes</a>
        <a className={tab === "permissions" ? "on" : ""} href="/admin?tab=permissions">Permissions</a>
      </div>
      {tab === "users" && await Users(s.id)}
      {tab === "bins" && await Bins()}
      {tab === "permissions" && await Permissions()}
    </main>
  );
}

async function Users(me: string) {
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  return <AdminClient me={me} users={users.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role, canSubmit: u.canSubmit, canExport: u.canExport, active: u.active }))} />;
}

async function Bins() {
  const [bins, buildings] = await Promise.all([
    db.bin.findMany({ include: { building: true }, orderBy: { binNumber: "asc" } }),
    db.building.findMany({ orderBy: { name: "asc" } }),
  ]);
  return <BinsClient buildings={buildings} bins={bins.map(b => ({ id: b.id, binNumber: b.binNumber, building: b.building.name, stream: b.wasteStream, containerType: b.containerType, locationNote: b.locationNote }))} />;
}

async function Permissions() {
  const users = await db.user.findMany({ orderBy: [{ role: "asc" }, { username: "asc" }] });
  const cols = ["Log pickups", "Own pickups", "All pickups", "Dashboard", "Export CSV", "Users and bins"];
  return (
    <>
      <p className="sub">What each person can do right now, based on their role and permission switches. Change them on the Users tab.</p>
      <div style={{ overflowX: "auto" }}>
        <table className="perm">
          <thead><tr><th>User</th><th>Role</th>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {users.map(u => {
              const on = u.active, staff = u.role !== "DRIVER";
              const perms = [on && u.canSubmit, on, on && staff, on && staff, on && u.canExport, on && u.role === "ADMIN"];
              return (
                <tr key={u.id} className={on ? "" : "off"}>
                  <td><b>{u.username}</b>{!on && <div className="meta">inactive</div>}</td>
                  <td>{ROLE_LABEL[u.role]}</td>
                  {perms.map((p, i) => <td key={i} className={p ? "yes" : "no"} aria-label={p ? "Yes" : "No"}>{p ? "✓" : "—"}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h2>What each role starts with</h2>
      <div className="card">
        <p><b>Driver:</b> logs pickups and sees only their own records.</p>
        <p><b>Sustainability staff and Supervisor:</b> everything a driver has, plus the dashboard and everyone&apos;s pickups.</p>
        <p style={{ marginBottom: 0 }}><b>Admin:</b> all of the above, plus managing users, bins and QR codes. Export is a separate switch for every role.</p>
      </div>
    </>
  );
}
