// Map coordinates for every collection point in lib/catalog.ts LOCATIONS,
// keyed by the exact `location` string. Most come from the building
// footprints in OpenStreetMap (centroid of the building). Entries marked
// `approx: true` weren't in OSM and are placed by hand near the right
// building. Check them on the Map page and correct here if needed.
export type LatLng = { lat: number; lng: number };
// `buildings` names the OpenStreetMap building(s) the point belongs to, as
// they appear in public/campus-buildings.geojson, so the 3D map can color the
// real building footprint by status.
export type GeoPoint = LatLng & { approx?: boolean; offCampus?: boolean; buildings?: string[] };

export const LOCATION_COORDS: Record<string, GeoPoint> = {
  ALPINE: { lat: 38.56168, lng: -121.42428, buildings: ["Alpine Hall"] },
  AMADOR: { lat: 38.55907, lng: -121.42466, buildings: ["Amador Hall"] },
  "ATHLETIC CENTER (FORM. STUDENT HEALTH)": { lat: 38.56350, lng: -121.42819, buildings: ["Hornet Athletic Center"] },
  "ARBORETUM *": { lat: 38.56507, lng: -121.42896 },
  "ART SCULPTURE LAB": { lat: 38.55787, lng: -121.41907, buildings: ["Art Studio Lab"] },
  BRIGHTON: { lat: 38.56130, lng: -121.42411, buildings: ["Brighton Hall"] },
  CAPISTRANO: { lat: 38.55992, lng: -121.42578, buildings: ["Capistrano Hall"] },
  "FACILITIES MANAGEMENT": { lat: 38.56351, lng: -121.42970, buildings: ["Facilities Managment"] },
  "BROAD FIELD HOUSE (ATHLETICS)": { lat: 38.55470, lng: -121.42380, approx: true },
  "KADEMA/LASSEN": { lat: 38.56242, lng: -121.42580, buildings: ["Kadema Hall","Lassen Hall"] },
  MARIPOSA: { lat: 38.56171, lng: -121.42540, buildings: ["Mariposa Hall"] },
  MENDOCINO: { lat: 38.56278, lng: -121.42356, buildings: ["Mendocino Hall"] },
  "PUBLIC SAFETY (INSIDE FENCE)": { lat: 38.55749, lng: -121.41970, buildings: ["Public Safety (Police)"] },
  "RECEIVING/MAIL/REPROGRAPHICS": { lat: 38.56282, lng: -121.42979, buildings: ["Receiving","Reprographics and Mailroom"] },
  "RIVERSIDE ENGINEERING": { lat: 38.56101, lng: -121.42244, buildings: ["Riverside Hall"] },
  SACRAMENTO: { lat: 38.56346, lng: -121.42628, buildings: ["Sacramento Hall"] },
  "SHASTA HALL": { lat: 38.56448, lng: -121.42402, buildings: ["Shasta Hall"] },
  SEQUOIA: { lat: 38.56204, lng: -121.42266, buildings: ["Sequoia Hall"] },
  "TAHOE HALL": { lat: 38.55838, lng: -121.42402, buildings: ["Tahoe Hall"] },
  "TSCHANNEN SCIENCE COMPLEX": { lat: 38.56063, lng: -121.42118, buildings: ["Ernest E. Tschannen Science Complex"] },
  // The library's three collection points sit around the one building.
  "LIBRARY - BOOK REC": { lat: 38.55985, lng: -121.42395, approx: true, buildings: ["Sac State Library"] },
  "LIBRARY CP": { lat: 38.55940, lng: -121.42340, approx: true, buildings: ["Sac State Library"] },
  "LIBRARY LOADING D": { lat: 38.55935, lng: -121.42400, approx: true, buildings: ["Sac State Library"] },
  "UNIV UNION E.DOCK": { lat: 38.55960, lng: -121.42195, approx: true, buildings: ["University Union"] },
  "UNIVERSITY UNION": { lat: 38.55964, lng: -121.42233, buildings: ["University Union"] },
  "DINING COMMONS": { lat: 38.56728, lng: -121.42593, buildings: ["Dining Commons"] },
  BOOKSTORE: { lat: 38.55995, lng: -121.42071, buildings: ["Hornet Bookstore"] },
  "FOLSOM HALL": { lat: 38.55134, lng: -121.41430, buildings: ["Folsom Hall"] },
  "MODOC HALL": { lat: 38.55320, lng: -121.41932, buildings: ["Modoc Hall"] },
  "NAPA HALL": { lat: 38.55380, lng: -121.41908, buildings: ["Napa Hall"] },
  "SIERRA HALL": { lat: 38.56693, lng: -121.42662, buildings: ["Sierra Hall"] },
  "AMC NORTH": { lat: 38.56610, lng: -121.42645, approx: true, buildings: ["American River Courtyard"] },
  "AMC SOUTH": { lat: 38.56565, lng: -121.42645, approx: true, buildings: ["American River Courtyard"] },
  "DESMOND HALL": { lat: 38.56649, lng: -121.42456, buildings: ["Desmond Hall"] },
  "DRAPER HALL": { lat: 38.56734, lng: -121.42487, buildings: ["Draper Hall"] },
  "KLAMATH HALL": { lat: 38.56760, lng: -121.42400, approx: true },
  "MT WHITNEY": { lat: 38.56600, lng: -121.42330, approx: true },
  "HOUSING-RIVERVIEW": { lat: 38.56554, lng: -121.42393, buildings: ["Riverview Hall"] },
  // At Lake Natoma, ~20 km from campus. Shown on the map but left out of the
  // campus route and the default zoom.
  "AQUATIC CENTER": { lat: 38.63453, lng: -121.21918, offCampus: true },
  "HORNET STADIUM TM": { lat: 38.55567, lng: -121.42295 },
};

// Trucks start and end the optimized route at the corporation yard.
export const DEPOT_LOCATION = "FACILITIES MANAGEMENT";

// Great-circle distance in meters.
export function distanceMeters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Best visiting order for a closed loop that starts and ends at point 0,
// given a symmetric distance table `d` (d[i][j] = meters from i to j).
// Returns the stop indices 1..n-1 in visiting order. Nearest-neighbour tour,
// then 2-opt until no swap shortens it: near-optimal for a few dozen stops
// and runs in milliseconds.
export function optimizeOrder(d: number[][]): number[] {
  const n = d.length;
  if (n <= 2) return n === 2 ? [1] : [];

  const tour = [0];
  const left = new Set(Array.from({ length: n - 1 }, (_, i) => i + 1));
  while (left.size) {
    const last = tour[tour.length - 1];
    let best = -1;
    left.forEach(i => { if (best < 0 || d[last][i] < d[last][best]) best = i; });
    tour.push(best);
    left.delete(best);
  }
  tour.push(0);

  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const delta = d[tour[i - 1]][tour[k]] + d[tour[i]][tour[k + 1]] - d[tour[i - 1]][tour[i]] - d[tour[k]][tour[k + 1]];
        if (delta < -1e-6) {
          tour.splice(i, k - i + 1, ...tour.slice(i, k + 1).reverse());
          improved = true;
        }
      }
    }
  }
  return tour.slice(1, -1);
}

// Straight-line version: best order to visit `stops` from `start` and back.
export function optimizeRoute<T extends LatLng>(start: LatLng, stops: T[]): T[] {
  const pts: LatLng[] = [start, ...stops];
  return optimizeOrder(pts.map(a => pts.map(b => distanceMeters(a, b)))).map(i => stops[i - 1]);
}

export function routeLengthMeters(start: LatLng, stops: LatLng[]) {
  const path = [start, ...stops, start];
  let m = 0;
  for (let i = 1; i < path.length; i++) m += distanceMeters(path[i - 1], path[i]);
  return m;
}
