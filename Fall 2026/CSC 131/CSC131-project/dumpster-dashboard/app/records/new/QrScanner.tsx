"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { BIN_CODE, binLink, normalizeCode } from "@/lib/bin-code";

// Our QR codes hold a link like https://site/records/new?bin=LIB-001; a code holding
// just "LIB-001" is accepted too.
function binFromQr(text: string) {
  try {
    const bin = new URL(text).searchParams.get("bin");
    if (bin) return normalizeCode(bin);
  } catch { /* not a URL */ }
  const raw = normalizeCode(text);
  return BIN_CODE.test(raw) ? raw : null;
}

export default function QrScanner() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    let lastScan = 0;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    function tick(now: number) {
      if (stopped) return;
      const v = videoRef.current;
      if (v && v.readyState >= 2 && now - lastScan > 150) {
        lastScan = now;
        const scale = Math.min(1, 640 / v.videoWidth);
        canvas.width = Math.round(v.videoWidth * scale);
        canvas.height = Math.round(v.videoHeight * scale);
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (hit) {
          const bin = binFromQr(hit.data);
          if (bin) {
            stopped = true;
            location.assign(binLink(bin));
            return;
          }
          setError("That QR code isn't a bin code.");
        }
      }
      frame = requestAnimationFrame(tick);
    }

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser can't open the camera here. The camera needs the site to be on HTTPS.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (stopped) return stream.getTracks().forEach(t => t.stop());
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        frame = requestAnimationFrame(tick);
      } catch (e) {
        const name = (e as DOMException).name;
        setError(name === "NotAllowedError"
          ? "Camera permission was blocked. Allow camera access for this site, or use your phone's camera app to scan the code."
          : name === "NotFoundError" ? "No camera was found on this device." : "Couldn't start the camera.");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [open]);

  function close() { setOpen(false); setError(""); }

  return (
    <>
      <button className="btn scan-btn" type="button" onClick={() => setOpen(true)}>Scan Bin QR Code</button>
      {open && (
        <div className="scanner-overlay" role="dialog" aria-label="Scan a bin QR code">
          <div className="scanner-panel">
            <h2>Scan a bin&apos;s QR code</h2>
            <div className="scanner-view">
              <video ref={videoRef} playsInline muted />
              <div className="scanner-frame" aria-hidden="true" />
            </div>
            {error ? <p className="login-message">{error}</p> : <p className="scanner-hint">Point the camera at the QR code on the bin.</p>}
            <button className="btn btn-secondary" type="button" onClick={close}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
