// Downloads every building footprint on and around campus from OpenStreetMap
// and writes public/campus-buildings.geojson, which the Campus Map extrudes in
// 3D and colors by status. Re-run when OSM gets better campus data:
//   node scripts/fetch-campus-buildings.mjs
import { writeFileSync } from "node:fs";

const BBOX = [38.5490, -121.4330, 38.5690, -121.4120]; // south, west, north, east
const LEVEL_HEIGHT_M = 3.6;
const DEFAULT_HEIGHT_M = 8;

// OSM has no height for most campus buildings. These floor counts are
// estimates so the 3D view looks roughly right; replace any you know better.
// A real OSM `height` or `building:levels` tag always wins over these.
const FLOOR_ESTIMATES = {
  "Sacramento Hall": 3, "Tahoe Hall": 3, "Mendocino Hall": 4, "Riverside Hall": 3,
  "Sequoia Hall": 4, "Ernest E. Tschannen Science Complex": 4, "Eureka Hall": 3,
  "Brighton Hall": 3, "Capistrano Hall": 3, "Santa Clara Hall": 3, "Placer Hall": 2,
  "University Union": 3, "Hornet Bookstore": 2, "Dining Commons": 2, "Mariposa Hall": 4,
  "Kadema Hall": 2, "Lassen Hall": 3, "Del Norte Hall": 2, "Calaveras Hall": 2,
  "Douglass Hall": 3, "Solano Hall": 2, "Humboldt Hall": 3, "Yosemite Hall": 2,
  "Desmond Hall": 4, "Draper Hall": 4, "Jenkins Hall": 4, "Sierra Hall": 3,
  "American River Courtyard": 4, "Riverview Hall": 5, "Shasta Hall": 3,
  "Folsom Hall": 4, "Academic Resource Center": 2, "Benicia Hall": 2,
  "Public Safety (Police)": 2, "Facilities Managment": 2, "Welcome Center": 2,
  "Parking Structure III": 5, "Parking Structure IV": 5, "Parking Structure 5": 5,
};

const query =`[out:json][timeout:60];
(way["building"](${BBOX.join(",")});relation["building"](${BBOX.join(",")}););
out geom tags;`;

// Public Overpass servers are often busy, so try a few mirrors in turn.
const SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

async function download() {
  for (const url of SERVERS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "csc131-dumpster-dashboard" },
        body: "data=" + encodeURIComponent(query),
      });
      if (res.ok) return (await res.json()).elements;
      console.warn(`${url} returned ${res.status}, trying next server`);
    } catch (err) {
      console.warn(`${url} failed (${err.message}), trying next server`);
    }
  }
  throw new Error("All Overpass servers failed. Try again in a few minutes.");
}

const elements = await download();

const num = v => { const n = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : undefined; };
const ring = pts => {
  const r = pts.map(p => [+p.lon.toFixed(6), +p.lat.toFixed(6)]);
  const [a, b] = [r[0], r[r.length - 1]];
  if (a[0] !== b[0] || a[1] !== b[1]) r.push(a);
  return r;
};

const features = [];
for (const e of elements) {
  const t = e.tags ?? {};
  const levels = num(t["building:levels"]);
  const floors = levels ?? FLOOR_ESTIMATES[t.name];
  const height = num(t.height) ?? (floors ? floors * LEVEL_HEIGHT_M : DEFAULT_HEIGHT_M);
  const minHeight = num(t.min_height) ?? (num(t["building:min_level"]) ?? 0) * LEVEL_HEIGHT_M;
  const properties = { name: t.name ?? null, height: Math.round(height * 10) / 10, minHeight: Math.round(minHeight * 10) / 10 };

  let polygons = [];
  if (e.type === "way" && e.geometry?.length > 3) {
    polygons = [[ring(e.geometry)]];
  } else if (e.type === "relation") {
    // Outer rings become polygons; inner rings (courtyards) are skipped for simplicity.
    polygons = (e.members ?? []).filter(m => m.role === "outer" && m.geometry?.length > 3).map(m => [ring(m.geometry)]);
  }
  for (const coordinates of polygons) features.push({ type: "Feature", properties, geometry: { type: "Polygon", coordinates } });
}

writeFileSync(new URL("../public/campus-buildings.geojson", import.meta.url), JSON.stringify({ type: "FeatureCollection", features }));
console.log(`Wrote ${features.length} buildings (${features.filter(f => f.properties.name).length} named).`);
