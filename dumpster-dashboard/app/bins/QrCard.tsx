"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { binLink } from "@/lib/bin-code";

// QR code for one bin. It links to this site's pickup form, so print codes from the
// deployed site, not from localhost.
export default function QrCard({ code, label }: { code: string; label: string }) {
  const [src, setSrc] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const u = location.origin + binLink(code);
    setUrl(u);
    QRCode.toDataURL(u, { width: 480, margin: 2 }).then(setSrc);
  }, [code]);

  async function download() {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement("canvas"); c.width = 520; c.height = 640;
    const x = c.getContext("2d")!;
    x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 20, 10, 480, 480);
    x.fillStyle = "#15121f"; x.textAlign = "center";
    x.font = "bold 46px sans-serif"; x.fillText(code, 260, 548);
    x.font = "22px sans-serif"; x.fillText(label, 260, 590, 490);
    const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = `bin-${code}.png`; a.click();
  }

  function print() {
    const w = window.open("", "_blank");
    if (!w) return;
    const d = w.document;
    d.title = `Bin ${code}`;
    d.body.style.cssText = "font-family:sans-serif;text-align:center;margin-top:40px";
    const img = d.createElement("img"); img.src = src; img.width = 360;
    const h = d.createElement("h1"); h.textContent = code;
    const p = d.createElement("p"); p.textContent = label;
    d.body.append(img, h, p);
    img.onload = () => { w.print(); };
  }

  return (
    <div className="qr-card">
      {src && <img src={src} alt={`QR code for bin ${code}`} />}
      <b>{code}</b>
      <span className="qr-label">{label}</span>
      {url && <a className="qr-url" href={url}>{url}</a>}
      <div className="qr-actions">
        <button className="btn btn-secondary" type="button" onClick={download} disabled={!src}>Download PNG</button>
        <button className="btn btn-secondary" type="button" onClick={print} disabled={!src}>Print</button>
      </div>
    </div>
  );
}

export function QrToggle({ code, label }: { code: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-secondary btn-small" type="button" onClick={() => setOpen(!open)}>{open ? "Hide QR" : "Show QR"}</button>
      {open && <QrCard code={code} label={label} />}
    </>
  );
}
