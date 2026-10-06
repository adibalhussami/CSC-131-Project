import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const STREAMS = ["TRASH", "RECYCLING", "COMPOST", "CARDBOARD", "OTHER"];

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "ADMIN") return Response.json({ error: "Admins only." }, { status: 403 });
  const b = await req.json();
  const binNumber = String(b.binNumber ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9._-]{2,30}$/.test(binNumber)) return Response.json({ error: "Bin number must be 2 to 30 letters, numbers, dots or dashes." }, { status: 400 });
  if (!STREAMS.includes(b.wasteStream)) return Response.json({ error: "Choose a waste stream." }, { status: 400 });
  if (!String(b.containerType ?? "").trim()) return Response.json({ error: "Choose a container type." }, { status: 400 });
  if (await db.bin.findUnique({ where: { binNumber } })) return Response.json({ error: "That bin number already exists." }, { status: 409 });

  let buildingId = b.buildingId as string | undefined;
  const newName = String(b.newBuilding ?? "").trim();
  if (!buildingId && newName) buildingId = (await db.building.upsert({ where: { name: newName }, update: {}, create: { name: newName } })).id;
  if (!buildingId) return Response.json({ error: "Choose or add a building." }, { status: 400 });

  const size = Number(b.sizeGallons);
  await db.bin.create({ data: {
    binNumber, buildingId, wasteStream: b.wasteStream, containerType: String(b.containerType).trim(),
    sizeGallons: Number.isFinite(size) && size > 0 ? Math.round(size) : null,
    locationNote: String(b.locationNote ?? "").trim() || null,
  } });
  return Response.json({ ok: true, binNumber });
}
