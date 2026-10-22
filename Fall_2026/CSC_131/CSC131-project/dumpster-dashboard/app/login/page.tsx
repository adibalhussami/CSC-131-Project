import { login } from "../actions";

export const metadata = { title: "Admin Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; logout?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="login-panel">
      <h1 className="page-title">Admin Login</h1>
      {sp.error && <p className="login-message">Invalid username or password.</p>}
      {sp.logout && <p className="login-message" style={{ color: "var(--muted)" }}>You have been logged out.</p>}
      <form action={login}>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        <button type="submit">Log In</button>
      </form>
    </main>
  );
}
