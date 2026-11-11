import { cookies } from "next/headers";

// Holds a just-created or just-reset PIN so Settings can show it to the admin
// once. Scoped to /settings and expires after two minutes.
export const NEW_PIN_COOKIE = "new_driver_pin";

export async function readNewPin(): Promise<{ username: string; pin: string } | null> {
  const raw = (await cookies()).get(NEW_PIN_COOKIE)?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return typeof v?.username === "string" && /^\d{6}$/.test(v?.pin) ? v : null;
  } catch {
    return null;
  }
}
