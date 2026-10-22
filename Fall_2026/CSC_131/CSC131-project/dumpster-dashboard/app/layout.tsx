import "./globals.css";
import { getSession } from "@/lib/auth";
import AppShell from "./AppShell";

export const metadata = { title: "Waste Dashboard" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en">
      <body>
        <AppShell loggedIn={!!session} role={session?.role ?? null}>{children}</AppShell>
      </body>
    </html>
  );
}
