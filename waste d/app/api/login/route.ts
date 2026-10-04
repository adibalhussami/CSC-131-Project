import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  const user = await db.user.findUnique({ where: { username: String(username).trim().toLowerCase() } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash)))
    return Response.json({ error: "Username or password is incorrect." }, { status: 401 });
  await createSession({ id: user.id, role: user.role, canSubmit: user.canSubmit, canExport: user.canExport });
  return Response.json({ ok: true, role: user.role });
}
