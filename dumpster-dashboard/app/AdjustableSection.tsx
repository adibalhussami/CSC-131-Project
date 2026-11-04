"use client";

// React port of the Spring app's dashboard-layout.js: cards can be dragged to
// reorder and resized from the corner, and both are remembered in localStorage
// (same keys as the Spring version).
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const STORAGE_PREFIX = "wasteDashboardLayout:";
const MAX_WIDTH_PX = 900;
const MAX_HEIGHT_PX = 700;

export type Widget = { id: string; className: string; style?: CSSProperties; content: ReactNode };
type Size = { w: string; h: string };

function read<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}
function clampPx(value: string, max: number) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.min(n, max) + "px" : undefined;
}

export default function AdjustableSection({ id, sectionKey, className, widgets }: {
  id: string; sectionKey: string; className?: string; widgets: Widget[];
}) {
  const storageKey = STORAGE_PREFIX + sectionKey;
  const [order, setOrder] = useState(() => widgets.map(w => w.id));
  const [sizes, setSizes] = useState<Record<string, Size>>({});
  const [loaded, setLoaded] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const els = useRef(new Map<string, HTMLDivElement>());
  const orderRef = useRef(order);
  orderRef.current = order;

  // Restore after mount so the server render and first client render match.
  useEffect(() => {
    const ids = widgets.map(w => w.id);
    const saved = read<string[]>(storageKey + ":order");
    if (saved) setOrder([...saved.filter(x => ids.includes(x)), ...ids.filter(x => !saved.includes(x))]);
    const restored: Record<string, Size> = {};
    ids.forEach(wid => {
      const s = read<Size>(`${storageKey}:${wid}:size`);
      const w = s && clampPx(s.w, MAX_WIDTH_PX), h = s && clampPx(s.h, MAX_HEIGHT_PX);
      if (w && h) restored[wid] = { w, h };
    });
    setSizes(restored);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!loaded || !window.ResizeObserver) return;
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const observers = [...els.current.entries()].map(([wid, el]) => {
      const ro = new ResizeObserver(() => {
        clearTimeout(timers.get(wid));
        timers.set(wid, setTimeout(() => {
          const r = el.getBoundingClientRect();
          write(`${storageKey}:${wid}:size`, { w: Math.round(r.width) + "px", h: Math.round(r.height) + "px" });
        }, 200));
      });
      ro.observe(el);
      return ro;
    });
    return () => { observers.forEach(o => o.disconnect()); timers.forEach(clearTimeout); };
  }, [loaded, storageKey]);

  function dragOver(e: React.DragEvent<HTMLDivElement>, overId: string) {
    e.preventDefault();
    if (!dragging || dragging === overId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientX - rect.left < rect.width / 2;
    const rest = orderRef.current.filter(x => x !== dragging);
    const idx = rest.indexOf(overId) + (before ? 0 : 1);
    const next = [...rest.slice(0, idx), dragging, ...rest.slice(idx)];
    if (next.join() !== orderRef.current.join()) setOrder(next);
  }

  const byId = new Map(widgets.map(w => [w.id, w]));
  return (
    <div id={id} className={className}>
      {order.map(wid => {
        const w = byId.get(wid);
        if (!w) return null;
        const size = sizes[wid];
        return (
          <div
            key={wid}
            ref={el => { if (el) els.current.set(wid, el); else els.current.delete(wid); }}
            data-widget-id={wid}
            className={w.className + (dragging === wid ? " dragging" : "")}
            style={{ ...w.style, ...(size ? { width: size.w, height: size.h } : {}) }}
            draggable
            onDragStart={() => setDragging(wid)}
            onDragEnd={() => { setDragging(null); write(storageKey + ":order", orderRef.current); }}
            onDragOver={e => dragOver(e, wid)}
          >
            {w.content}
          </div>
        );
      })}
    </div>
  );
}

export function ResetLayoutButton() {
  function reset() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX)).forEach(k => localStorage.removeItem(k));
    } catch { /* storage unavailable */ }
    location.reload();
  }
  return <button className="btn btn-secondary" type="button" onClick={reset}>Reset Layout</button>;
}
