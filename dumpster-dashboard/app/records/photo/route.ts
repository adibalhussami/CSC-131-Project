import type { NextRequest } from "next/server";
import { getSession, isStaff } from "@/lib/auth";
import { db } from "@/lib/db";

// One pickup's bin photo (/records/photo?id=<pickup id>), read from the database.
// Staff only, same as the records page.
export async function GET(req: NextRequest) {
  if (!isStaff(await getSession())) return Response.redirect(new URL("/login", req.url));
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const photo = /^\d+$/.test(id) ? await db.pickupPhoto.findUnique({ where: { recordId: Number(id) } }) : null;
  if (!photo) return new Response("No photo for this pickup", { status: 404 });
  return new Response(Buffer.from(photo.data), {
    headers: { "Content-Type": photo.contentType, "Cache-Control": "private, max-age=3600" },
  });
}
