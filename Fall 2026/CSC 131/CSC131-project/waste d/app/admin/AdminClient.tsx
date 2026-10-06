"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type U = { id: string; username: string; name: string; role: string; canSubmit: boolean; canExport: boolean; active: boolean };
const ROLES = [["DRIVER", "Driver"], ["SUSTAINABILITY", "Sustainability staff"], ["SUPERVISOR", "Supervisor"], ["ADMIN", "Admin"]];

export default function AdminClient({ users, me }: { users: U[]; me: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form));
    const r = await fetch("/api/users", { method: "POST", body: JSON.stringify({ ...f, canExport: f.canExport === "on" }) });
    const j = await r.json();
    if (!r.ok) return setMsg({ ok: false, text: j.error });
    setMsg({ ok: true, text: `User ${f.username} created.` });
    form.reset(); router.refresh();
  }
  async function patch(body: Record<string, unknown>) {
    const r = await fetch("/api/users", { method: "PATCH", body: JSON.stringify(body) });
    const j = await r.json();
    setMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: j.error });
    router.refresh();
  }

  return (
    <>
      <div className="card">
        <h2>Add a user</h2>
        <form onSubmit={create}>
          <div className="grid2">
            <div><label>Username</label><input name="username" required autoCapitalize="none" placeholder="jsmith" /></div>
            <div><label>Password</label><input name="password" type="text" required minLength={8} placeholder="At least 8 characters" /></div>
          </div>
          <div className="grid2">
            <div><label>Role</label><select name="role" defaultValue="DRIVER">{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div><label>Full name (optional)</label><input name="name" placeholder="Jordan Smith" /></div>
          </div>
          <label className="row"><input type="checkbox" name="canExport" /> Can export reports</label>
          <button>Create user</button>
        </form>
        {msg && <div className={`msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
      </div>

      <h2>Everyone</h2>
      {users.map(u => (
        <div className={`card user ${u.active ? "" : "off"}`} key={u.id}>
          <div className="who"><b>{u.username}</b><span>{u.name !== u.username ? u.name : ""}</span></div>
          <select value={u.role} disabled={u.id === me} onChange={e => patch({ id: u.id, role: e.target.value })}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <div className="toggles">
            <label className="row"><input type="checkbox" checked={u.canSubmit} onChange={e => patch({ id: u.id, canSubmit: e.target.checked })} /> Submit pickups</label>
            <label className="row"><input type="checkbox" checked={u.canExport} onChange={e => patch({ id: u.id, canExport: e.target.checked })} /> Export</label>
            <label className="row"><input type="checkbox" checked={u.active} disabled={u.id === me} onChange={e => patch({ id: u.id, active: e.target.checked })} /> Active</label>
          </div>
          <button className="sec" onClick={() => { const p = prompt(`New password for ${u.username} (8+ characters)`); if (p) patch({ id: u.id, password: p }); }}>Reset password</button>
        </div>
      ))}
    </>
  );
}
