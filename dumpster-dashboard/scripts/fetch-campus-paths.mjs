// Downloads the walkable network on and around campus (footpaths, sidewalks,
// service roads, plazas, streets) from OpenStreetMap and writes
// public/campus-paths.json, a compact graph the Campus Map routes over so
// the optimized route follows real paths instead of cutting through buildings.
// Re-run when OSM gets better campus data:  npm run map:paths
import { writeFileSync } from "node:fs";

const BBOX = [38.5480, -121.4340, 38.5700, -121.4110]; // south, west, north, east

// Everything a driver with a cart or a service vehicle could plausibly use.
// Motorways/trunks are left out on purpose.
const query = `[out:json][timeout:90];
way["highway"~"^(footway|path|pedestrian|steps|service|living_street|residential|unclassified|tertiary|secondary|primary|cycleway|track|corridor)(_link)?$"]["access"!~"^(no|private)$"](${BBOX.join(",")});
out geom tags;`;

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
        signal: AbortSignal.timeout(120_000),
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

// Nodes shared between ways become the graph's junctions. Coordinates are
// rounded to ~10 cm, which also merges duplicate points.
const key = p => `${p.lat.toFixed(6)},${p.lon.toFixed(6)}`;
const index = new Map();
const nodes = [];
const edges = new Set();
const id = p => {
  const k = key(p);
  if (!index.has(k)) { index.set(k, nodes.length); nodes.push([+p.lon.toFixed(6), +p.lat.toFixed(6)]); }
  return index.get(k);
};

for (const w of elements) {
  const g = w.geometry ?? [];
  for (let i = 1; i < g.length; i++) {
    const a = id(g[i - 1]);
    const b = id(g[i]);
    if (a !== b) edges.add(a < b ? `${a},${b}` : `${b},${a}`);
  }
}

const flatEdges = [...edges].flatMap(e => e.split(",").map(Number));
writeFileSync(new URL("../public/campus-paths.json", import.meta.url), JSON.stringify({ nodes, edges: flatEdges }));
console.log(`Wrote ${nodes.length} path nodes and ${edges.size} segments from ${elements.length} ways.`);
