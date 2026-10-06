import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";

// Saves to /public/uploads. For production, swap for S3 / Vercel Blob / similar.
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || !s.canSubmit) return Response.json({ error: "Not allowed." }, { status: 403 });
  const file = (await req.formData()).get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 8_000_000)
    return Response.json({ error: "Upload an image under 8 MB." }, { status: 400 });
  const ext = file.type.split("/")[1].replace(/[^a-z0-9]/gi, "") || "jpg";
  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return Response.json({ url: `/uploads/${name}` });
}
