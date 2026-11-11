import { safeReturnTo } from "@/lib/auth";
import { driverLogin } from "../../actions";

export const metadata = { title: "Driver Sign-in" };

const ERRORS: Record<string, string> = {
  "1": "Wrong username or PIN.",
  locked: "Too many wrong PINs. This account is locked for 15 minutes. Ask an admin if you need a new PIN.",
};

export default async function DriverLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  const next = safeReturnTo(sp.next);
  const scanned = /[?&]bin=/.test(next);
  return (
    <main className="login-panel">
      <h1 className="page-title">Driver Sign-in</h1>
      <p className="page-intro" style={{ margin: "-8px 0 16px" }}>
        {scanned ? "Sign in to log a pickup for the bin you scanned. " : ""}
        Use the username and 6-digit PIN your supervisor gave you. You&apos;ll stay signed in on this phone for 30 days.
      </p>
      {sp.error && <p className="login-message">{ERRORS[sp.error] ?? ERRORS["1"]}</p>}
      <form action={driverLogin}>
        <input type="hidden" name="next" value={next} />
        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" required />
        <label htmlFor="pin">PIN</label>
        <input id="pin" name="pin" type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="current-password" required />
        <button type="submit">Sign In</button>
      </form>
      <p className="login-switch">Supervisor or admin? <a href="/login">Staff login</a></p>
    </main>
  );
}
