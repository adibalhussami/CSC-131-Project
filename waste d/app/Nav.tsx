"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Clock from "./Clock";

export type Item = { label: string; href: string; sub: string };

export default function Nav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/log") : path.startsWith(href));
  return (
    <>
      <button className="menubtn" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="site-menu">Menu</button>
      <nav id="site-menu" className={`menu-panel ${open ? "open" : ""}`} aria-label="Main">
        <a className="brand brandin" href="/"><i />Campus Waste</a>
        <button className="closebtn" onClick={() => setOpen(false)}>Close</button>
        <div className="links">
          {items.map(i => (
            <a key={i.href} href={i.href} className={active(i.href) ? "on" : ""}><span>{i.label}</span><small>{i.sub}</small></a>
          ))}
        </div>
        <div className="menu-foot"><Clock /><a href="/api/logout">Sign out</a></div>
      </nav>
    </>
  );
}
