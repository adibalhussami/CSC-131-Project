import "./globals.css";
import { getSession } from "@/lib/auth";
import { logout } from "./actions";

export const metadata = { title: "Waste Dashboard" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en">
      <body>
        <header className="app-topbar">
          <a className="app-brand" href="/">CSC 131 Waste Dashboard</a>
          <nav className="app-nav-links">
            <a href="/">Dashboard</a>
            <a href="/records/new">Log a Pickup</a>
            <a href="/records">All Records</a>
            <a href="/bins">Bins &amp; QR Codes</a>
          </nav>
          <div className="app-nav-login">
            {session ? (
              <form action={logout}><button type="submit">Log Out</button></form>
            ) : (
              <a href="/login">Admin Login</a>
            )}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
