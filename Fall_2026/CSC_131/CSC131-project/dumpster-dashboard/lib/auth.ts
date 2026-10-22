import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

export type Session = { username: string; role: UserRole };
const COOKIE = "session";

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set. Add it to .env (local) or the Vercel project settings.");
  return new TextEncoder().encode(secret);
}

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("12h").sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload as unknown as Session; } catch { return null; }
}

// Dashboard and records pages need a login (employee or admin); the pickup form stays public.
export async function requireUser() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

// Bin registry, cost page and CSV import are admin-only.
export async function requireAdmin() {
  const s = await requireUser();
  if (s.role !== "ADMIN") redirect("/");
  return s;
}
