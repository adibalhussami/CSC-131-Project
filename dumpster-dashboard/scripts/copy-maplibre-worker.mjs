// MapLibre 6 renders map tiles in a Web Worker loaded from its own file, which
// Next's bundler doesn't pick up. Copy it into public/ (served at
// /maplibre-gl-worker.mjs) so app/map/CampusMap.tsx can point MapLibre at it.
// Runs on every `npm install` via the postinstall script.
import { copyFileSync, mkdirSync } from "node:fs";

const from = new URL("../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url);
const to = new URL("../public/maplibre-gl-worker.mjs", import.meta.url);
mkdirSync(new URL("../public/", import.meta.url), { recursive: true });
copyFileSync(from, to);
