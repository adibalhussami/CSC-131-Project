import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
export type Session = { id: string; role: string; canSubmit: boolean; canExport: boolean };

export async function createSession(u: Session) {
  const token = await new SignJWT({ ...u }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("12h").sign(key);
  (await cookies()).set("session", token, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
}
export async function getSession(): Promise<Session | null> {
  const t = (await cookies()).get("session")?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key)).payload as unknown as Session; } catch { return null; }
}
