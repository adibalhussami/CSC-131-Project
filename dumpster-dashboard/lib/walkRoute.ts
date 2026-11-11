// Walking routes over campus paths, computed in the browser.
//
// public/campus-paths.json (built by scripts/fetch-campus-paths.mjs) is the
// walkable network from OpenStreetMap: footpaths, sidewalks, plazas and
// service roads. Each stop is snapped to its nearest path point, shortest
// paths between every pair of stops come from Dijkstra's algorithm, and the
// visiting order is optimized on those real walking distances. The result is
// drawn along the paths instead of in straight lines through buildings.
import { distanceMeters, optimizeOrder, type LatLng } from "@/lib/geo";

export type PathGraph = { nodes: [number, number][]; edges: number[] }; // nodes are [lng, lat]
export type Coord = [number, number]; // [lng, lat], what the map draws

// A stop farther than this from any path is treated as unreachable on foot
// and joined with a straight line instead.
const MAX_SNAP_METERS = 250;

export class WalkRouter {
  private nodes: LatLng[];
  // Adjacency in compressed form: neighbours of node i are
  // adjTo[adjStart[i] .. adjStart[i+1]), with lengths in adjLen.
  private adjStart: Int32Array;
  private adjTo: Int32Array;
  private adjLen: Float64Array;

  constructor(graph: PathGraph) {
    this.nodes = graph.nodes.map(([lng, lat]) => ({ lat, lng }));
    const n = this.nodes.length;
    const degree = new Int32Array(n + 1);
    for (let i = 0; i < graph.edges.length; i += 2) { degree[graph.edges[i]]++; degree[graph.edges[i + 1]]++; }
    this.adjStart = new Int32Array(n + 1);
    for (let i = 0; i < n; i++) this.adjStart[i + 1] = this.adjStart[i] + degree[i];
    this.adjTo = new Int32Array(this.adjStart[n]);
    this.adjLen = new Float64Array(this.adjStart[n]);
    const fill = this.adjStart.slice(0, n);
    for (let i = 0; i < graph.edges.length; i += 2) {
      const a = graph.edges[i];
      const b = graph.edges[i + 1];
      const len = distanceMeters(this.nodes[a], this.nodes[b]);
      this.adjTo[fill[a]] = b; this.adjLen[fill[a]++] = len;
      this.adjTo[fill[b]] = a; this.adjLen[fill[b]++] = len;
    }
  }

  nearest(p: LatLng) {
    let best = -1;
    let bestD = Infinity;
    // Cheap planar pre-check, exact distance only for close candidates.
    const cos = Math.cos((p.lat * Math.PI) / 180);
    for (let i = 0; i < this.nodes.length; i++) {
      const q = this.nodes[i];
      const dx = (q.lng - p.lng) * cos;
      const dy = q.lat - p.lat;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best < 0 ? null : { id: best, meters: distanceMeters(p, this.nodes[best]) };
  }

  // Shortest distance from `src` to every node, plus the tree to rebuild paths.
  shortestFrom(src: number) {
    const n = this.nodes.length;
    const dist = new Float64Array(n).fill(Infinity);
    const prev = new Int32Array(n).fill(-1);
    const heap = new MinHeap();
    dist[src] = 0;
    heap.push(src, 0);
    while (heap.size) {
      const [u, du] = heap.pop();
      if (du > dist[u]) continue;
      for (let e = this.adjStart[u]; e < this.adjStart[u + 1]; e++) {
        const v = this.adjTo[e];
        const dv = du + this.adjLen[e];
        if (dv < dist[v]) { dist[v] = dv; prev[v] = u; heap.push(v, dv); }
      }
    }
    return { dist, prev };
  }

  pathTo(prev: Int32Array, target: number): Coord[] {
    const out: Coord[] = [];
    for (let v = target; v >= 0; v = prev[v]) out.push([this.nodes[v].lng, this.nodes[v].lat]);
    return out.reverse();
  }
}

export type WalkPlan<T> = { stops: T[]; meters: number; line: Coord[]; walked: boolean };

// Plans the loop depot -> stops -> depot. Uses walking paths when a router is
// available, otherwise (or for stops far from any path) straight lines.
export function planRoute<T extends LatLng>(router: WalkRouter | null, depot: LatLng, stops: T[]): WalkPlan<T> {
  const pts: LatLng[] = [depot, ...stops];
  const straight = (a: LatLng, b: LatLng): Coord[] => [[a.lng, a.lat], [b.lng, b.lat]];

  if (!router || stops.length === 0) {
    const order = optimizeOrder(pts.map(a => pts.map(b => distanceMeters(a, b))));
    const path = [0, ...order, 0].map(i => pts[i]);
    let meters = 0;
    for (let i = 1; i < path.length; i++) meters += distanceMeters(path[i - 1], path[i]);
    return { stops: order.map(i => stops[i - 1]), meters, line: path.map(p => [p.lng, p.lat]), walked: false };
  }

  const snaps = pts.map(p => { const s = router.nearest(p); return s && s.meters <= MAX_SNAP_METERS ? s : null; });
  const trees = snaps.map(s => (s ? router.shortestFrom(s.id) : null));

  // d[i][j]: walk from point i to its path, along paths, then to point j.
  // Falls back to 1.4 x straight-line when there's no connection.
  const d = pts.map((a, i) => pts.map((b, j) => {
    if (i === j) return 0;
    const si = snaps[i];
    const sj = snaps[j];
    const along = si && sj ? trees[i]!.dist[sj.id] : Infinity;
    return Number.isFinite(along) ? si!.meters + along + sj!.meters : distanceMeters(a, b) * 1.4;
  }));

  const order = [0, ...optimizeOrder(d), 0];
  const line: Coord[] = [];
  let meters = 0;
  for (let k = 1; k < order.length; k++) {
    const i = order[k - 1];
    const j = order[k];
    meters += d[i][j];
    const si = snaps[i];
    const sj = snaps[j];
    const leg = si && sj && Number.isFinite(trees[i]!.dist[sj.id])
      ? [[pts[i].lng, pts[i].lat] as Coord, ...router.pathTo(trees[i]!.prev, sj.id), [pts[j].lng, pts[j].lat] as Coord]
      : straight(pts[i], pts[j]);
    line.push(...(line.length ? leg.slice(1) : leg));
  }
  return { stops: order.slice(1, -1).map(i => stops[i - 1]), meters, line, walked: true };
}

class MinHeap {
  private ids: number[] = [];
  private keys: number[] = [];
  get size() { return this.ids.length; }
  push(id: number, key: number) {
    const ids = this.ids, keys = this.keys;
    let i = ids.length;
    ids.push(id); keys.push(key);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (keys[p] <= key) break;
      ids[i] = ids[p]; keys[i] = keys[p]; i = p;
    }
    ids[i] = id; keys[i] = key;
  }
  pop(): [number, number] {
    const ids = this.ids, keys = this.keys;
    const top: [number, number] = [ids[0], keys[0]];
    const lastId = ids.pop()!;
    const lastKey = keys.pop()!;
    if (ids.length) {
      let i = 0;
      const n = ids.length;
      for (;;) {
        const l = 2 * i + 1;
        if (l >= n) break;
        const r = l + 1;
        const c = r < n && keys[r] < keys[l] ? r : l;
        if (keys[c] >= lastKey) break;
        ids[i] = ids[c]; keys[i] = keys[c]; i = c;
      }
      ids[i] = lastId; keys[i] = lastKey;
    }
    return top;
  }
}
