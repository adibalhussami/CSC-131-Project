import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

// uid/name/sv are set on sessions created after driver accounts were added.
// `sv` is the user's sessionVersion when they signed in; resetting a driver's
// PIN or deactivating them bumps it, which invalidates older sessions.
export type Session = { username: string; role: UserRole; uid?: number; name?: string; sv?: number };
const COOKIE = "session";

const STAFF_HOURS = 12;
const DRIVER_DAYS = 30; // drivers sign in once per phone, not every shift

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set. Add it to .env (local) or the Vercel project settings.");
  return new TextEncoder().encode(secret);
}

export async function createSession(s: Session) {
  const seconds = s.role === "DRIVER" ? DRIVER_DAYS * 86_400 : STAFF_HOURS * 3_600;
  const token = await new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setExpirationTime(`${seconds}s`).sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production",
    // Staff cookies end with the browser session; drivers' persist on the phone.
    maxAge: s.role === "DRIVER" ? seconds : undefined,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload as unknown as Session; } catch { return null; }
}

export const isStaff = (s: Session | null) => s?.role === "ADMIN" || s?.role === "EMPLOYEE";

// A driver's session is only good while their account is active and their PIN
// hasn't been reset since they signed in.
async function driverStillValid(s: Session) {
  if (!s.uid) return false;
  const u = await db.user.findUnique({ where: { id: s.uid }, select: { active: true, role: true, sessionVersion: true } });
  return !!u && u.active && u.role === "DRIVER" && u.sessionVersion === (s.sv ?? 0);
}

// Dashboard, records, bins and cost pages: employees and admins only. Drivers
// who wander here are sent back to the pickup form.
export async function requireUser() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!isStaff(s)) redirect("/records/new");
  return s;
}

// Bin registry management, settings, drivers and CSV import are admin-only.
export async function requireAdmin() {
  const s = await requireUser();
  if (s.role !== "ADMIN") redirect("/");
  return s;
}

// The pickup form and campus map: any signed-in staff member, or a driver
// whose account is still valid. Others go to the driver sign-in, then come
// back to `returnTo` (e.g. the scanned bin's link).
export async function requireFieldUser(returnTo: string) {
  const s = await getSession();
  if (s && (isStaff(s) || (s.role === "DRIVER" && (await driverStillValid(s))))) return s;
  redirect(`/driver/login?next=${encodeURIComponent(returnTo)}`);
}

// Only allow redirects back into the app's own field pages.
export function safeReturnTo(next: string | undefined | null) {
  const n = String(next ?? "");
  return /^\/(records\/new|map)(\?|$)/.test(n) ? n : "/records/new";
}
