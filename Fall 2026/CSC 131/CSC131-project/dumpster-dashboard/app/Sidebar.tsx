"use client";

import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { logout } from "./actions";

type IconProps = { className?: string };

function IconDashboard({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.4" />
      <rect x="11" y="2.5" width="6.5" height="4" rx="1.4" />
      <rect x="11" y="8.5" width="6.5" height="9" rx="1.4" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.4" />
    </svg>
  );
}

function IconPlus({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6.5v7M6.5 10h7" />
    </svg>
  );
}

function IconList({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M7 5.5h10M7 10h10M7 14.5h10" />
      <circle cx="3.2" cy="5.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.2" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.2" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconQr({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1" />
      <rect x="12" y="2.5" width="5.5" height="5.5" rx="1" />
      <rect x="2.5" y="12" width="5.5" height="5.5" rx="1" />
      <path d="M12.5 12.5h2.3v2.3h-2.3zM15.5 12.5h2v2M12.5 17.5h2.3M17.5 15.5v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCost({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2.8v14.4M13.4 5.8c0-1.3-1.5-2.3-3.4-2.3s-3.4 1-3.4 2.3S7.7 8 10 8s3.4 1 3.4 2.3-1.5 2.3-3.4 2.3-3.4-1-3.4-2.3" />
    </svg>
  );
}

function IconLogout({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 17H4.5A1.5 1.5 0 0 1 3 15.5v-11A1.5 1.5 0 0 1 4.5 3H8" />
      <path d="M13 13.5 17 10l-4-3.5" />
      <path d="M17 10H7.5" />
    </svg>
  );
}

function IconPanelHide({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3.5" width="15" height="13" rx="2.2" />
      <path d="M7.8 3.5v13" />
      <path d="M13.3 8l-2 2 2 2" />
    </svg>
  );
}

function IconSettings({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 3v2M10 15v2M17 10h-2M5 10H3M14.95 5.05l-1.4 1.4M6.45 13.55l-1.4 1.4M14.95 14.95l-1.4-1.4M6.45 6.45l-1.4-1.4" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", Icon: IconDashboard, adminOnly: false },
  { href: "/records/new", label: "Log a Pickup", Icon: IconPlus, adminOnly: false },
  { href: "/records", label: "All Records", Icon: IconList, adminOnly: false },
  { href: "/bins", label: "Bins & QR Codes", Icon: IconQr, adminOnly: false },
  { href: "/cost", label: "Cost", Icon: IconCost, adminOnly: false },
  { href: "/settings", label: "Settings", Icon: IconSettings, adminOnly: true },
];

export default function Sidebar({ loggedIn, role, onToggle }: { loggedIn: boolean; role: UserRole | null; onToggle: () => void }) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS.filter(item => !item.adminOnly || role === "ADMIN");

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-header">
        <a className="app-brand" href="/">
          <span className="app-brand-mark">CSC</span>
          <span className="app-brand-text">
            <span className="app-brand-title">Waste Dashboard</span>
            <span className="app-brand-sub">CSC 131</span>
          </span>
        </a>
        <button type="button" className="sidebar-hide-btn" onClick={onToggle} aria-label="Hide sidebar">
          <IconPanelHide className="nav-icon" />
        </button>
      </div>

      <nav className="app-nav-links">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <a key={href} href={href} className={active ? "nav-link active" : "nav-link"}>
              <Icon className="nav-icon" />
              <span>{label}</span>
            </a>
          );
        })}
      </nav>

      <div className="app-sidebar-footer">
        {loggedIn ? (
          <>
            <div className="sidebar-role-badge">{role === "ADMIN" ? "Admin" : "Employee"}</div>
            <form action={logout}>
              <button type="submit" className="nav-link nav-link-button">
                <IconLogout className="nav-icon" />
                <span>Log Out</span>
              </button>
            </form>
          </>
        ) : (
          <a href="/login" className="nav-link">
            <IconLogout className="nav-icon" />
            <span>Admin Login</span>
          </a>
        )}
      </div>
    </aside>
  );
}
