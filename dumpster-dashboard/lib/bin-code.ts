// Bin-code helpers with no server imports, so the QR components can use them in the browser.
export const BIN_CODE = /^[A-Z0-9._-]{2,30}$/;
export const normalizeCode = (s: string) => s.trim().toUpperCase();

// QR codes encode `${origin}${binLink(code)}`.
export const binLink = (code: string) => `/records/new?bin=${encodeURIComponent(code)}`;
