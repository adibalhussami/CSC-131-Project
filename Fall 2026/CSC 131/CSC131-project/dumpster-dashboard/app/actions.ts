"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { ContaminationLevel, WasteStream } from "@prisma/client";
import { db } from "@/lib/db";
import { clearSession, createSession, requireAdmin } from "@/lib/auth";
import { LOCATIONS } from "@/lib/catalog";
import { CONTAMINATION_LEVELS, WASTE_STREAMS } from "@/lib/records";
import { csvToRecords } from "@/lib/csv";
import { BIN_CODE, normalizeCode } from "@/lib/bin-code";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
// Form sends the catalog index; reject blanks (Number("") is 0, the first location).
const locationAt = (f: FormData) => { const v = str(f, "location"); return /^\d+$/.test(v) ? LOCATIONS[Number(v)] : undefined; };

export async function login(form: FormData) {
  const username = str(form, "username").toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) redirect("/login?error=1");
  await createSession({ username: user.username });
  redirect("/");
}

export async function logout() {
  await clearSession();
  redirect("/login?logout=1");
}

// Public: drivers log pickups without an account, same as the Spring app.
export async function createRecord(form: FormData) {
  const location = locationAt(form);
  const driverName = str(form, "driverName");
  const wasteStream = str(form, "wasteStream") as WasteStream;
  const contamination = str(form, "contamination") as ContaminationLevel;
  const fullnessPercent = Number(str(form, "fullnessPercent"));
  if (!location || !driverName || !WASTE_STREAMS.includes(wasteStream) || !CONTAMINATION_LEVELS.includes(contamination)
    || !Number.isInteger(fullnessPercent) || fullnessPercent < 0 || fullnessPercent > 100) {
    redirect("/records/new?error=1");
  }
  await db.pickupRecord.create({
    data: {
      building: location.building,
      location: location.location,
      binId: str(form, "binId").slice(0, 100) || null,
      driverName: driverName.slice(0, 100),
      wasteStream,
      fullnessPercent,
      contamination,
      overflow: form.get("overflow") === "true",
      comments: str(form, "comments").slice(0, 1000) || null,
    },
  });
  redirect("/records/new?submitted=1");
}

export async function importCsv(form: FormData) {
  await requireAdmin();
  const file = form.get("file");
  // typeof check rather than `instanceof File`: File isn't a global on Node 18.
  if (!file || typeof file === "string" || file.size === 0) redirect("/records?imported=0");
  const { records, skipped } = csvToRecords(await file.text());
  if (records.length) await db.pickupRecord.createMany({ data: records });
  redirect(`/records?imported=${records.length}&skipped=${skipped}`);
}

export async function createBin(form: FormData) {
  await requireAdmin();
  const code = normalizeCode(str(form, "code"));
  const location = locationAt(form);
  const wasteStream = str(form, "wasteStream") as WasteStream;
  if (!BIN_CODE.test(code)) redirect("/bins?error=code");
  if (!location || !WASTE_STREAMS.includes(wasteStream)) redirect("/bins?error=fields");
  if (await db.bin.findUnique({ where: { code } })) redirect("/bins?error=exists");
  await db.bin.create({
    data: { code, building: location.building, location: location.location, wasteStream, notes: str(form, "notes").slice(0, 200) || null },
  });
  redirect(`/bins?created=${encodeURIComponent(code)}`);
}

export async function deleteBin(form: FormData) {
  await requireAdmin();
  await db.bin.deleteMany({ where: { id: Number(str(form, "id")) } });
  redirect("/bins");
}
