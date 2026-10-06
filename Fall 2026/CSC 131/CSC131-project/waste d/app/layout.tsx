import "./globals.css";
import { getSession } from "@/lib/auth";
import Nav, { type Item } from "./Nav";

export const metadata = { title: "Campus Waste Collection" };

export default async function Root({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  const items: Item[] = [];
  if (s) {
    if (s.canSubmit) items.push({ label: "Log a pickup", href: "/", sub: "Record a collection" });
    if (s.role !== "DRIVER") items.push({ label: "Dashboard", href: "/dashboard", sub: "Graphs and totals" });
    items.push({ label: "All pickups", href: "/pickups", sub: s.role === "DRIVER" ? "Your records" : "Every record" });
    if (s.role === "ADMIN") items.push({ label: "Admin", href: "/admin", sub: "Users, bins, permissions" });
  }
  return (
    <html lang="en">
      <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
      <body className={s ? "has-nav" : ""}>
        <header className="top">
          <a className="brand" href="/"><i />Campus Waste</a>
          {s && <Nav items={items} />}
        </header>
        {children}
      </body>
    </html>
  );
}
