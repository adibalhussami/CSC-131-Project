"use server";

import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ContaminationLevel, WasteStream } from "@prisma/client";
import { db } from "@/lib/db";
import { clearSession, createSession, requireAdmin, requireFieldUser, requireUser, safeReturnTo } from "@/lib/auth";
import { LOCATIONS } from "@/lib/catalog";
import { CONTAINER_SIZES, CONTAMINATION_LEVELS, WASTE_STREAMS } from "@/lib/records";
import { csvToRecords } from "@/lib/csv";
import { BIN_CODE, normalizeCode } from "@/lib/bin-code";
import { NEW_PIN_COOKIE } from "@/lib/drivers";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
// Form sends the catalog index; reject blanks (Number("") is 0, the first location).
const locationAt = (f: FormData) => { const v = str(f, "location"); return /^\d+$/.test(v) ? LOCATIONS[Number(v)] : undefined; };

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Staff (admin/employee) sign-in with username + password.
export async function login(form: FormData) {
  const username = str(form, "username").toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { username } });
  if (!user || user.role === "DRIVER" || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?error=1");
  }
  await createSession({ username: user.username, role: user.role, uid: user.id });
  redirect("/");
}

// Driver sign-in with username + 6-digit PIN. Five wrong PINs lock the
// account for 15 minutes, so a PIN can't be guessed by trying them all.
export async function driverLogin(form: FormData) {
  const username = str(form, "username").toLowerCase();
  const pin = str(form, "pin");
  const next = safeReturnTo(str(form, "next"));
  const back = (error: string) => redirect(`/driver/login?error=${error}&next=${encodeURIComponent(next)}`);

  const user = await db.user.findUnique({ where: { username } });
  if (!user || user.role !== "DRIVER" || !user.active || !user.pinHash) back("1");
  const driver = user!;
  if (driver.lockedUntil && driver.lockedUntil > new Date()) back("locked");

  if (!/^\d{6}$/.test(pin) || !(await bcrypt.compare(pin, driver.pinHash!))) {
    const failed = driver.failedLogins + 1;
    const lock = failed >= MAX_PIN_ATTEMPTS;
    await db.user.update({
      where: { id: driver.id },
      data: { failedLogins: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null },
    });
    back(lock ? "locked" : "1");
  }

  await db.user.update({ where: { id: driver.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await createSession({
    username: driver.username, role: "DRIVER", uid: driver.id, name: driver.displayName ?? driver.username, sv: driver.sessionVersion,
  });
  redirect(next);
}

export async function logout() {
  await clearSession();
  redirect("/login?logout=1");
}

// Drivers (or staff) must be signed in; the driver's name comes from their
// account, not from the form. When a registered bin was scanned, its
// location, waste stream and container size come from the bin record, so the
// driver only answers questions about the bin's condition.
export async function createRecord(form: FormData) {
  const binCode = normalizeCode(str(form, "binCode"));
  const session = await requireFieldUser(binCode ? `/records/new?bin=${encodeURIComponent(binCode)}` : "/records/new");
  const bin = BIN_CODE.test(binCode) ? await db.bin.findUnique({ where: { code: binCode } }) : null;
  const backTo = `/records/new?error=1${bin ? `&bin=${encodeURIComponent(bin.code)}` : ""}`;

  const location = bin ? { building: bin.building, location: bin.location } : locationAt(form);
  const wasteStream = (bin?.wasteStream ?? str(form, "wasteStream")) as WasteStream;
  const containerSize = bin?.containerSize || str(form, "containerSize");
  const contamination = str(form, "contamination") as ContaminationLevel;
  const fullnessPercent = Number(str(form, "fullnessPercent"));
  const serviceCompleted = str(form, "serviceCompleted");
  const maintenance = str(form, "maintenance");
  const serviceNotCompletedReason = str(form, "serviceCompletedNote").slice(0, 200);
  const maintenanceNotes = str(form, "maintenanceNote").slice(0, 200);
  if (!location || !WASTE_STREAMS.includes(wasteStream) || !CONTAMINATION_LEVELS.includes(contamination)
    || !Number.isInteger(fullnessPercent) || fullnessPercent < 0 || fullnessPercent > 100
    || !CONTAINER_SIZES.includes(containerSize)
    || !["yes", "no"].includes(serviceCompleted) || (serviceCompleted === "no" && !serviceNotCompletedReason)
    || !["yes", "no"].includes(maintenance) || (maintenance === "yes" && !maintenanceNotes)) {
    redirect(backTo);
  }

  await db.pickupRecord.create({
    data: {
      building: location!.building,
      location: location!.location,
      binId: bin?.code ?? (str(form, "binId").slice(0, 100) || null),
      driverName: (session.name ?? session.username).slice(0, 100),
      driverId: session.role === "DRIVER" ? session.uid : null,
      wasteStream,
      fullnessPercent,
      contamination,
      overflow: form.get("overflow") === "true",
      comments: str(form, "comments").slice(0, 1000) || null,
      containerSize,
      serviceCompleted: serviceCompleted === "yes",
      serviceNotCompletedReason: serviceCompleted === "no" ? serviceNotCompletedReason : null,
      maintenanceIssue: maintenance === "yes",
      maintenanceNotes: maintenance === "yes" ? maintenanceNotes : null,
    },
  });
  redirect("/records/new?submitted=1");
}

export async function deleteRecord(form: FormData) {
  await requireUser();
  await db.pickupRecord.deleteMany({ where: { id: Number(str(form, "id")) } });
  const returnTo = str(form, "returnTo");
  redirect(returnTo.startsWith("/records") ? returnTo : "/records");
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

export async function updateCostRates(form: FormData) {
  await requireAdmin();
  for (const stream of WASTE_STREAMS) {
    const raw = str(form, `rate_${stream}`);
    const usdPerPickup = Number(raw);
    if (!Number.isFinite(usdPerPickup) || usdPerPickup < 0) redirect("/settings?error=1");
    await db.costRate.upsert({
      where: { wasteStream: stream },
      update: { usdPerPickup },
      create: { wasteStream: stream, usdPerPickup },
    });
  }
  redirect("/settings?saved=1");
}

export async function createBin(form: FormData) {
  await requireAdmin();
  const code = normalizeCode(str(form, "code"));
  const location = locationAt(form);
  const wasteStream = str(form, "wasteStream") as WasteStream;
  const containerSize = str(form, "containerSize");
  if (!BIN_CODE.test(code)) redirect("/bins?error=code");
  if (!location || !WASTE_STREAMS.includes(wasteStream)) redirect("/bins?error=fields");
  if (containerSize && !CONTAINER_SIZES.includes(containerSize)) redirect("/bins?error=fields");
  if (await db.bin.findUnique({ where: { code } })) redirect("/bins?error=exists");
  await db.bin.create({
    data: {
      code, building: location.building, location: location.location, wasteStream,
      containerSize: containerSize || null, notes: str(form, "notes").slice(0, 200) || null,
    },
  });
  redirect(`/bins?created=${encodeURIComponent(code)}`);
}

export async function deleteBin(form: FormData) {
  await requireAdmin();
  await db.bin.deleteMany({ where: { id: Number(str(form, "id")) } });
  redirect("/bins");
}

// ---- Drivers (admin) ----

const newPin = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

// The new PIN is shown to the admin once, via a short-lived cookie scoped to
// the Settings page, so it never appears in a URL or the browser history.
async function showPinOnce(username: string, pin: string) {
  (await cookies()).set(NEW_PIN_COOKIE, JSON.stringify({ username, pin }), {
    httpOnly: true, sameSite: "strict", path: "/settings", maxAge: 120, secure: process.env.NODE_ENV === "production",
  });
}

export async function dismissNewPin() {
  await requireAdmin();
  (await cookies()).delete({ name: NEW_PIN_COOKIE, path: "/settings" });
  redirect("/settings#drivers");
}

function slug(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "").slice(0, 24) || "driver";
}

export async function createDriver(form: FormData) {
  await requireAdmin();
  const displayName = str(form, "displayName").slice(0, 60);
  if (displayName.length < 2) redirect("/settings?driverError=name#drivers");
  const base = slug(displayName);
  let username = base;
  for (let i = 2; await db.user.findUnique({ where: { username } }); i++) username = `${base}${i}`;
  const pin = newPin();
  await db.user.create({ data: { username, displayName, role: "DRIVER", pinHash: await bcrypt.hash(pin, 10) } });
  await showPinOnce(username, pin);
  redirect("/settings#drivers");
}

export async function resetDriverPin(form: FormData) {
  await requireAdmin();
  const id = Number(str(form, "id"));
  const driver = await db.user.findFirst({ where: { id, role: "DRIVER" } });
  if (!driver) redirect("/settings#drivers");
  const pin = newPin();
  await db.user.update({
    where: { id },
    data: { pinHash: await bcrypt.hash(pin, 10), sessionVersion: { increment: 1 }, failedLogins: 0, lockedUntil: null },
  });
  await showPinOnce(driver!.username, pin);
  redirect("/settings#drivers");
}

export async function setDriverActive(form: FormData) {
  await requireAdmin();
  const id = Number(str(form, "id"));
  const active = str(form, "active") === "true";
  await db.user.updateMany({
    where: { id, role: "DRIVER" },
    // Deactivating also signs the driver out everywhere.
    data: { active, ...(active ? {} : { sessionVersion: { increment: 1 } }) },
  });
  redirect("/settings#drivers");
}

// ---- Data reset (admin) ----

export async function clearData(form: FormData) {
  await requireAdmin();
  const scope = str(form, "scope");
  if (str(form, "confirm") !== "DELETE") redirect("/settings?dataError=confirm#data");

  let records = 0;
  let bins = 0;
  if (scope === "demo") {
    records = (await db.pickupRecord.deleteMany({ where: { isDemo: true } })).count;
    bins = (await db.bin.deleteMany({ where: { isDemo: true } })).count;
  } else if (scope === "records") {
    records = (await db.pickupRecord.deleteMany({})).count;
  } else if (scope === "all") {
    [records, bins] = (await db.$transaction([db.pickupRecord.deleteMany({}), db.bin.deleteMany({})])).map(r => r.count);
  } else {
    redirect("/settings#data");
  }
  redirect(`/settings?cleared=${records}.${bins}#data`);
}
