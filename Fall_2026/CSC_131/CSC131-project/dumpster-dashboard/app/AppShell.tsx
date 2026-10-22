"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@prisma/client";
import Sidebar from "./Sidebar";

const STORAGE_KEY = "sidebar-collapsed";

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </svg>
  );
}

export default function AppShell({ loggedIn, role, children }: { loggedIn: boolean; role: UserRole | null; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggle() {
    setCollapsed(c => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className={collapsed ? "app-shell sidebar-collapsed" : "app-shell"}>
      <Sidebar loggedIn={loggedIn} role={role} onToggle={toggle} />
      {collapsed && (
        <button type="button" className="sidebar-reopen" onClick={toggle} aria-label="Show sidebar">
          <IconMenu className="nav-icon" />
        </button>
      )}
      <div className="app-content">{children}</div>
    </div>
  );
}
