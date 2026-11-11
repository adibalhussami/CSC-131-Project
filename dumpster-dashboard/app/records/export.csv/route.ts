import type { NextRequest } from "next/server";
import { getSession, isStaff } from "@/lib/auth";
import { recordsToCsv } from "@/lib/csv";
import { parseFilter, searchRecords } from "@/lib/records";

export async function GET(req: NextRequest) {
  if (!isStaff(await getSession())) return Response.redirect(new URL("/login", req.url));
  const filter = parseFilter(Object.fromEntries(req.nextUrl.searchParams));
  return new Response(recordsToCsv(await searchRecords(filter)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pickup-records.csv"',
    },
  });
}
