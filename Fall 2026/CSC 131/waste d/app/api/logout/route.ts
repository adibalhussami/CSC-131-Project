import { cookies } from "next/headers";
export async function GET(req: Request) {
  (await cookies()).delete("session");
  return Response.redirect(new URL("/login", req.url));
}
