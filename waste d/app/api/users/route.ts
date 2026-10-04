import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function admin() { const s = await getSession(); return s?.role === "ADMIN" ? s : null; }

export async function POST(req: Request) {
  if (!(await admin())) return Response.json({ error: "Admins only." }, { status: 403 });
  const b = await req.json();
  const username = String(b.username ?? "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) return Response.json({ error: "Username must be 3 to 30 letters, numbers, dots, dashes or underscores." }, { status: 400 });
  if (String(b.password ?? "").length < 8) return Response.json({ error: "Password needs at least 8 characters." }, { status: 400 });
  if (await db.user.findUnique({ where: { username } })) return Response.json({ error: "That username is taken. Try another." }, { status: 409 });
  const role = ["DRIVER", "SUSTAINABILITY", "SUPERVISOR", "ADMIN"].includes(b.role) ? b.role : "DRIVER";
  await db.user.create({ data: { username, name: String(b.name || username), passwordHash: await bcrypt.hash(b.password, 10), role, canExport: !!b.canExport } });
  return Response.json({ ok: true });
}

export async function PATCH(req: Request) {
  const s = await admin();
  if (!s) return Response.json({ error: "Admins only." }, { status: 403 });
  const b = await req.json();
  if (b.id === s.id && (b.active === false || (b.role && b.role !== "ADMIN"))) return Response.json({ error: "You can't remove your own admin access." }, { status: 400 });
  const data: Record<string, unknown> = {};
  for (const k of ["canSubmit", "canExport", "active"]) if (typeof b[k] === "boolean") data[k] = b[k];
  if (b.role) data.role = b.role;
  if (b.password) { if (String(b.password).length < 8) return Response.json({ error: "Password needs at least 8 characters." }, { status: 400 }); data.passwordHash = await bcrypt.hash(b.password, 10); }
  await db.user.update({ where: { id: b.id }, data });
  return Response.json({ ok: true });
}
