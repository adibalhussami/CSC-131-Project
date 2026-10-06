"use client";
import { useState } from "react";

export default function Login() {
  const [err, setErr] = useState("");
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/login", { method: "POST", body: JSON.stringify(Object.fromEntries(f)) });
    const j = await r.json();
    if (!r.ok) return setErr(j.error);
    location.href = "/";
  }
  return (
    <main className="narrow">
      <div className="card">
        <h1>Sign in</h1>
        <p className="sub">Campus waste collection tracker</p>
        <form onSubmit={go}>
          <label>Username</label><input name="username" required autoComplete="username" autoCapitalize="none" />
          <label>Password</label><input name="password" type="password" required autoComplete="current-password" />
          <button>Sign in</button>
          {err && <div className="msg err">{err}</div>}
        </form>
      </div>
    </main>
  );
}
