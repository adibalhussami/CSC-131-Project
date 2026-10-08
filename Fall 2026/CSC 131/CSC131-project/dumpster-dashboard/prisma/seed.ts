// `npm run seed`: creates/updates the admin login from ADMIN_USERNAME/ADMIN_PASSWORD,
// then adds 50 simulated pickups and a few demo bins (with QR codes) if those tables
// are empty, like the Spring DataSeeder. Set SEED_DEMO_DATA=false to skip the demo data.
import { ContaminationLevel, PrismaClient, WasteStream } from "@prisma/client";
import bcrypt from "bcryptjs";
import { LOCATIONS } from "../lib/catalog";

const db = new PrismaClient();
const SEED_COUNT = 50;
const DRIVERS = ["Laura", "Mohd", "Connor", "Ali", "Priya"];
const STREAMS = Object.values(WasteStream);
const FULLNESS_VALUES = [0, 25, 50, 75, 100];

// Small seeded PRNG so every run produces the same demo data.
function rng(seed: number) {
  return (n: number) => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * n);
  };
}

function contamination(roll: number): ContaminationLevel {
  if (roll < 7) return "NONE";
  if (roll < 9) return "A_LITTLE";
  return "A_LOT";
}

async function main() {
  const username = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) throw new Error("Set ADMIN_PASSWORD (8+ characters) before seeding.");
  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.upsert({ where: { username }, update: { passwordHash }, create: { username, passwordHash } });
  console.log(`Admin login ready: ${username}`);

  if (process.env.SEED_DEMO_DATA === "false") return;

  if ((await db.bin.count()) === 0) {
    const demoBins: [string, string, WasteStream][] = [
      ["LIB-CP-LF-01", "LIBRARY CP", "LANDFILL"],
      ["LIB-CP-RC-01", "LIBRARY CP", "RECYCLING"],
      ["UNION-OR-01", "UNIVERSITY UNION", "ORGANICS"],
      ["ALP-LF-01", "ALPINE", "LANDFILL"],
    ];
    for (const [code, location, wasteStream] of demoBins) {
      const loc = LOCATIONS.find(l => l.location === location)!;
      await db.bin.create({ data: { code, building: loc.building, location: loc.location, wasteStream } });
    }
    console.log(`Seeded ${demoBins.length} demo bins.`);
  }

  if ((await db.pickupRecord.count()) > 0) return;
  const random = rng(42);
  const now = Date.now();
  await db.pickupRecord.createMany({
    data: Array.from({ length: SEED_COUNT }, (_, i) => {
      const loc = LOCATIONS[random(LOCATIONS.length)];
      const fullnessPercent = FULLNESS_VALUES[random(FULLNESS_VALUES.length)];
      const overflow = fullnessPercent === 100 && random(3) === 0;
      return {
        collectionDate: new Date(now - random(30) * 86_400_000 - random(12) * 3_600_000),
        building: loc.building,
        location: loc.location,
        binId: `SIM-${String(i + 1).padStart(3, "0")}`,
        driverName: DRIVERS[random(DRIVERS.length)],
        wasteStream: STREAMS[random(STREAMS.length)],
        fullnessPercent,
        contamination: contamination(random(10)),
        overflow,
        comments: overflow ? "Waste piled outside the bin." : null,
      };
    }),
  });
  console.log(`Seeded ${SEED_COUNT} demo pickup records.`);
}

main().finally(() => db.$disconnect());
