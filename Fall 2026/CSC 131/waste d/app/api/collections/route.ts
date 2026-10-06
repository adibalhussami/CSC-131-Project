import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || !s.canSubmit) return Response.json({ error: "You don't have permission to submit pickups." }, { status: 403 });
  const b = await req.json();
  const bin = await db.bin.findUnique({ where: { binNumber: String(b.binNumber) } });
  if (!bin) return Response.json({ error: "Bin not found." }, { status: 404 });
  await db.collection.create({
    data: {
      driverId: s.id, binId: bin.id, fullness: b.fullness, status: b.status ?? "COMPLETED",
      contaminated: !!b.contaminated, contaminationTypes: b.contaminationTypes ?? [],
      overflow: !!b.overflow, damaged: !!b.damaged, comments: b.comments || null,
      photos: { create: (b.photoUrls ?? []).filter((u: string) => u.startsWith("/uploads/")).map((url: string) => ({ url })) },
    },
  });
  return Response.json({ ok: true });
}
