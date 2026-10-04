import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  await db.user.upsert({
    where: { username: "admin" }, update: {},
    create: { name: "Admin", username: "admin", passwordHash: await bcrypt.hash("changeme123", 10), role: "ADMIN", canExport: true },
  });
  const b = await db.building.upsert({ where: { name: "Library" }, update: {}, create: { name: "Library" } });
  for (const [n, s] of [["LIB-001", "TRASH"], ["LIB-002", "RECYCLING"]] as const)
    await db.bin.upsert({ where: { binNumber: n }, update: {}, create: { binNumber: n, buildingId: b.id, wasteStream: s, containerType: "Cart", sizeGallons: 96 } });
}
main().finally(() => db.$disconnect());
