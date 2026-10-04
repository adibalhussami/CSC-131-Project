"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

type Bin = { id: string; binNumber: string; building: string; stream: string; containerType: string; locationNote: string | null };

function QrCard({ bin }: { bin: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => { QRCode.toDataURL(`${location.origin}/log?bin=${encodeURIComponent(bin)}`, { width: 480, margin: 2 }).then(setSrc); }, [bin]);

  async function download() {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement("canvas"); c.width = 520; c.height = 600;
    const x = c.getContext("2d")!;
    x.fillStyle = "#fff"; x.fillRect(0, 0, 520, 600); x.drawImage(img, 20, 10, 480, 480);
    x.fillStyle = "#16231c"; x.font = "bold 48px sans-serif"; x.textAlign = "center"; x.fillText(bin, 260, 560);
    const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = `bin-${bin}.png`; a.click();
  }
  function print() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<title>${bin}</title><body style="font-family:sans-serif;text-align:center"><img src="${src}" width="360"><h1>${bin}</h1><script>onload=()=>print()<\/script>`);
    w.document.close();
  }
  return (
    <div className="qr">
      {src && <img src={src} alt={`QR code for bin ${bin}`} />}
      <b>{bin}</b>
      <div className="grid2"><button className="sec" onClick={download}>Download PNG</button><button className="sec" onClick={print}>Print</button></div>
    </div>
  );
}

export default function BinsClient({ bins, buildings }: { bins: Bin[]; buildings: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [building, setBuilding] = useState(buildings[0]?.id ?? "__new");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(null);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form));
    const r = await fetch("/api/bins", { method: "POST", body: JSON.stringify({ ...f, buildingId: building === "__new" ? undefined : building }) });
    const j = await r.json();
    if (!r.ok) return setMsg({ ok: false, text: j.error });
    setMsg({ ok: true, text: `Bin ${j.binNumber} added.` });
    setCreated(j.binNumber); form.reset(); router.refresh();
  }

  return (
    <>
      <button onClick={() => { setOpen(!open); setMsg(null); setCreated(null); }}>{open ? "Close" : "Add a bin"}</button>
      {open && (
        <div className="card" style={{ marginTop: 14 }}>
          <form onSubmit={add}>
            <div className="grid2">
              <div><label>Bin number</label><input name="binNumber" required placeholder="LIB-003" autoCapitalize="characters" /></div>
              <div><label>Building</label>
                <select value={building} onChange={e => setBuilding(e.target.value)}>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}<option value="__new">New building…</option>
                </select></div>
            </div>
            {building === "__new" && <><label>New building name</label><input name="newBuilding" required placeholder="Science Hall" /></>}
            <div className="grid2">
              <div><label>Waste stream</label><select name="wasteStream" defaultValue="TRASH">{["TRASH", "RECYCLING", "COMPOST", "CARDBOARD", "OTHER"].map(x => <option key={x} value={x}>{x[0] + x.slice(1).toLowerCase()}</option>)}</select></div>
              <div><label>Container type</label><select name="containerType" defaultValue="Cart">{["Cart", "Dumpster", "Roll-off", "Indoor bin", "Other"].map(x => <option key={x}>{x}</option>)}</select></div>
            </div>
            <div className="grid2">
              <div><label>Size in gallons (optional)</label><input name="sizeGallons" type="number" min={1} placeholder="96" /></div>
              <div><label>Location note (optional)</label><input name="locationNote" placeholder="North entrance" /></div>
            </div>
            <button>Save bin and create QR code</button>
          </form>
          {msg && <div className={`msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
          {created && <QrCard bin={created} />}
        </div>
      )}

      <h2>All bins</h2>
      {bins.length === 0 && <div className="card">No bins yet. Add your first one above.</div>}
      {bins.map(b => (
        <div className="card binrow" key={b.id}>
          <div><b>{b.binNumber}</b><span className="meta"> · {b.building} · {b.stream.toLowerCase()} · {b.containerType.toLowerCase()}{b.locationNote ? ` · ${b.locationNote}` : ""}</span></div>
          <button className="sec" onClick={() => setShown(shown === b.binNumber ? null : b.binNumber)}>{shown === b.binNumber ? "Hide QR code" : "Show QR code"}</button>
          {shown === b.binNumber && <QrCard bin={b.binNumber} />}
        </div>
      ))}
    </>
  );
}
