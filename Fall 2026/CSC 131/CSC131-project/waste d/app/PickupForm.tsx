"use client";
import { useState } from "react";

const TYPES = ["Food waste", "Plastic bags", "Liquids", "Wrong material"];

export default function PickupForm({ bins, initialBin }: { bins: { n: string; label: string }[]; initialBin?: string }) {
  const [bin, setBin] = useState(initialBin ?? "");
  const [fullness, setFullness] = useState("");
  const [status, setStatus] = useState("COMPLETED");
  const [contaminated, setContaminated] = useState(false);
  const [types, setTypes] = useState<string[]>([]);
  const [overflow, setOverflow] = useState(false);
  const [damaged, setDamaged] = useState(false);
  const [comments, setComments] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function addPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    setUploading(false); e.target.value = "";
    if (!r.ok) return setMsg({ ok: false, text: j.error });
    setPhotos(p => [...p, j.url]);
  }

  async function submit() {
    if (!bin || !fullness) return setMsg({ ok: false, text: "Choose a bin and a fullness level." });
    const r = await fetch("/api/collections", { method: "POST", body: JSON.stringify({ binNumber: bin, fullness, status, contaminated, contaminationTypes: types, overflow, damaged, comments, photoUrls: photos }) });
    const j = await r.json();
    if (!r.ok) return setMsg({ ok: false, text: j.error });
    setMsg({ ok: true, text: `Pickup saved for ${bin}.` });
    setBin(""); setFullness(""); setStatus("COMPLETED"); setContaminated(false); setTypes([]); setOverflow(false); setDamaged(false); setComments(""); setPhotos([]);
  }

  return (
    <div>
      <label>Bin</label>
      <select value={bin} onChange={e => setBin(e.target.value)}>
        <option value="">Select a bin</option>
        {bins.map(b => <option key={b.n} value={b.n}>{b.label}</option>)}
      </select>
      <label>Fullness before pickup</label>
      <div className="slider">
        <div className="readout">{fullness ? `${fullness.slice(1)}% full` : "Slide to set"}</div>
        <input type="range" min={0} max={100} step={25} aria-label="Fullness before pickup"
          value={fullness ? Number(fullness.slice(1)) : 0}
          onChange={e => setFullness(`P${e.target.value}`)}
          onPointerUp={e => { if (!fullness) setFullness(`P${(e.target as HTMLInputElement).value}`); }} />
        <div className="ticks"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
      </div>
      <label>Service</label>
      <select value={status} onChange={e => setStatus(e.target.value)}>
        <option value="COMPLETED">Completed</option><option value="DELAYED">Delayed</option>
        <option value="INCOMPLETE">Incomplete</option><option value="MISSED">Missed</option>
      </select>
      <label className="row"><input type="checkbox" checked={overflow} onChange={e => setOverflow(e.target.checked)} /> Material outside the bin</label>
      <label className="row"><input type="checkbox" checked={damaged} onChange={e => setDamaged(e.target.checked)} /> Bin damaged or needs maintenance</label>
      <label className="row"><input type="checkbox" checked={contaminated} onChange={e => setContaminated(e.target.checked)} /> Contamination seen</label>
      {contaminated && TYPES.map(t => (
        <label key={t} className="row"><input type="checkbox" checked={types.includes(t)} onChange={e => setTypes(e.target.checked ? [...types, t] : types.filter(x => x !== t))} /> {t}</label>
      ))}
      <label>Comments (optional)</label>
      <textarea rows={2} value={comments} onChange={e => setComments(e.target.value)} />
      <label>Photos</label>
      <input type="file" accept="image/*" capture="environment" onChange={addPhoto} />
      {uploading && <p>Uploading photo...</p>}
      <div className="thumbs">{photos.map(u => <img key={u} src={u} alt="Attached" />)}</div>
      <button onClick={submit} disabled={uploading}>Save pickup</button>
      {msg && <div className={`msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
    </div>
  );
}
