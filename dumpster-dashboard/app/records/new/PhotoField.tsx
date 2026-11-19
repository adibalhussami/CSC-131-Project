"use client";

import { useEffect, useRef, useState } from "react";

// Camera photos are several MB: over the server-action limit (next.config.ts) and slow
// on campus Wi-Fi. They're shrunk here, on the phone, before the form is submitted.
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.8;
// Must match MAX_PHOTO_BYTES in app/actions.ts.
const MAX_BYTES = 3.5 * 1024 * 1024;

async function shrink(file: File) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close();
  const blob = await new Promise<Blob | null>(done => canvas.toBlob(done, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new Error("Couldn't encode the photo");
  return new File([blob], "bin-photo.jpg", { type: "image/jpeg" });
}

// Required photo of the bin. Opens the rear camera on phones, a file picker elsewhere.
export default function PhotoField() {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function onChange() {
    const el = input.current!;
    const file = el.files?.[0];
    setPreview("");
    if (!file) { setNote(""); return; }
    setNote("Preparing photo…");
    try {
      const small = await shrink(file);
      const files = new DataTransfer();
      files.items.add(small);
      el.files = files.files;
      setPreview(URL.createObjectURL(small));
      setNote("");
    } catch {
      // The browser couldn't decode it (e.g. HEIC on a desktop): send the original if it fits.
      if (file.size > MAX_BYTES) {
        el.value = "";
        setNote("That photo couldn't be used. Please take another one.");
        return;
      }
      setPreview(URL.createObjectURL(file));
      setNote("");
    }
  }

  return (
    <div>
      <label htmlFor="photo">Photo of the bin</label>
      <input ref={input} id="photo" name="photo" type="file" accept="image/*" capture="environment" required onChange={onChange} />
      {note && <p className="photo-note" aria-live="polite">{note}</p>}
      {preview && <img className="photo-preview" src={preview} alt="Preview of the bin photo" />}
    </div>
  );
}
