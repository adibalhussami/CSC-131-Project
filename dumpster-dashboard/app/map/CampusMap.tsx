"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as MapLibre from "maplibre-gl";
import type { LatLng } from "@/lib/geo";
import { planRoute, WalkRouter, type PathGraph, type WalkPlan } from "@/lib/walkRoute";
import type { MapSite, SiteSeverity } from "@/lib/mapData";

const SEVERITY_LABEL: Record<SiteSeverity, string> = {
  RED: "Needs work",
  YELLOW: "Watch",
  GREEN: "OK",
  NONE: "No data",
};
const SEVERITY_ORDER: SiteSeverity[] = ["RED", "YELLOW", "GREEN", "NONE"];
const SEVERITY_RANK: Record<SiteSeverity, number> = { RED: 3, YELLOW: 2, GREEN: 1, NONE: 0 };

// Same colors as --red/--yellow/--green in globals.css; map paint can't read CSS variables.
const SEVERITY_COLOR: Record<SiteSeverity, string> = {
  RED: "#ef4444",
  YELLOW: "#f59e0b",
  GREEN: "#10b981",
  NONE: "#8e88a8",
};
const SELECTED_COLOR = "#8b7bf7";

// Rough time estimate: walking pace with a cart (~4.5 km/h), plus a few
// minutes per stop to service the bins.
const METERS_PER_MINUTE = 75;
const MINUTES_PER_STOP = 4;

// Free vector basemap (no API key) and Esri satellite imagery.
const STREET_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const SATELLITE_STYLE: MapLibre.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "satellite", type: "raster", source: "satellite" }],
};

type Depot = LatLng & { name: string };
type Basemap = "street" | "satellite";
type BuildingCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon, { name: string | null; height: number; minHeight: number }>;

// Opens on the academic core, close enough to read the 3D buildings. Outlying
// sites (Folsom Hall, Modoc, the stadium) are a short pan or scroll away.
const INITIAL_VIEW = { center: [-121.4240, 38.5612] as [number, number], zoom: 16.2 };

const BUILDINGS_SRC = "campus-buildings";
const ROUTE_SRC = "route";
const OTHER_LAYER = "campus-buildings-other";
const SITE_LAYER = "campus-buildings-sites";

type Plan = WalkPlan<MapSite> & { minutes: number; signature: string };
const signatureOf = (keys: Iterable<string>) => [...keys].sort().join("|");

export default function CampusMap({ sites, depot, canViewRecords }: { sites: MapSite[]; depot: Depot; canViewRecords: boolean }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibre.Map | null>(null);
  const libRef = useRef<typeof MapLibre | null>(null);
  const markersRef = useRef<MapLibre.Marker[]>([]);
  const rawBuildings = useRef<BuildingCollection | null>(null);
  const [styleVersion, setStyleVersion] = useState(0); // bumps each time a basemap finishes loading
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [visible, setVisible] = useState<Record<SiteSeverity, boolean>>({ RED: true, YELLOW: true, GREEN: true, NONE: true });
  // Route planning: the user picks stops, then presses Optimize.
  const [routeKeys, setRouteKeys] = useState<Set<string>>(new Set());
  const [pickMode, setPickMode] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const routerRef = useRef<WalkRouter | null>(null);
  const [pathsReady, setPathsReady] = useState<boolean | null>(null); // null = loading
  const [basemap, setBasemap] = useState<Basemap>("street");
  const [tilted, setTilted] = useState(true);

  const counts = useMemo(() => {
    const c: Record<SiteSeverity, number> = { RED: 0, YELLOW: 0, GREEN: 0, NONE: 0 };
    sites.forEach(s => c[s.severity]++);
    return c;
  }, [sites]);

  const planStale = !!plan && plan.signature !== signatureOf(routeKeys);
  const stopNumber = useMemo(() => new Map((plan && !planStale ? plan.stops : []).map((s, i) => [s.key, i + 1])), [plan, planStale]);
  const pickedSites = useMemo(() => sites.filter(s => routeKeys.has(s.key)), [sites, routeKeys]);

  function toggleStop(key: string) {
    setRouteKeys(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  }
  function addAll(sev: SiteSeverity) {
    setRouteKeys(prev => new Set([...prev, ...sites.filter(s => s.severity === sev && !s.offCampus).map(s => s.key)]));
  }
  function optimize() {
    const p = planRoute(routerRef.current, depot, pickedSites);
    setPlan({ ...p, minutes: Math.round(p.meters / METERS_PER_MINUTE + p.stops.length * MINUTES_PER_STOP), signature: signatureOf(routeKeys) });
  }

  // Map listeners are registered once, so they call through a ref to see the
  // current pick mode.
  const onSiteClick = useRef<(key: string) => void>(() => {});
  onSiteClick.current = key => { setSelectedKey(key); if (pickMode) toggleStop(key); };
  const selected = sites.find(s => s.key === selectedKey) ?? null;

  // OSM building name -> the worst-off site inside it (several collection
  // points, like the library's three, can share one building).
  const siteByBuilding = useMemo(() => {
    const m = new Map<string, MapSite>();
    sites.forEach(s => s.buildings?.forEach(b => {
      const cur = m.get(b);
      if (!cur || SEVERITY_RANK[s.severity] > SEVERITY_RANK[cur.severity]) m.set(b, s);
    }));
    return m;
  }, [sites]);

  // Create the map once. MapLibre needs `window`, so it's loaded client-side only.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      import("maplibre-gl"),
      fetch("/campus-buildings.geojson").then(r => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([lib, buildings]) => {
      // The walkway network loads separately; until it arrives (or if it
      // fails), Optimize falls back to straight lines.
      fetch("/campus-paths.json")
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then((g: PathGraph) => { if (!cancelled) { routerRef.current = new WalkRouter(g); setPathsReady(true); } })
        .catch(() => { if (!cancelled) setPathsReady(false); });
      if (cancelled || !mapEl.current || mapRef.current) return;
      libRef.current = lib;
      rawBuildings.current = buildings;
      lib.setWorkerUrl("/maplibre-gl-worker.mjs");

      const map = new lib.Map({
        container: mapEl.current,
        style: STREET_STYLE,
        ...INITIAL_VIEW,
        pitch: 55,
        bearing: -20,
        maxPitch: 75,
        attributionControl: { compact: true },
      });
      map.addControl(new lib.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new lib.ScaleControl({ unit: "imperial" }), "bottom-left");
      map.on("style.load", () => setStyleVersion(v => v + 1));
      // Clicking a colored building opens its site. Plain map listeners (not
      // layer-scoped ones) so they keep working after a basemap switch
      // re-creates the layer.
      const siteAt = (p: MapLibre.PointLike) => {
        if (!map.getLayer(SITE_LAYER)) return undefined;
        const key = map.queryRenderedFeatures(p, { layers: [SITE_LAYER] })[0]?.properties?.siteKey;
        return typeof key === "string" ? key : undefined;
      };
      map.on("click", e => { const key = siteAt(e.point); if (key) onSiteClick.current(key); });
      map.on("mousemove", e => { map.getCanvas().style.cursor = siteAt(e.point) ? "pointer" : ""; });
      map.on("error", e => { if (!map.loaded()) setLoadError(e.error?.message ?? "Map failed to load"); });
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch between the street and satellite basemaps.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    const isSatellite = !!map.getSource("satellite");
    if ((basemap === "satellite") !== isSatellite) map.setStyle(basemap === "satellite" ? SATELLITE_STYLE : STREET_STYLE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basemap]);

  // Add our 3D buildings and route line on top of whichever basemap loaded.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;

    // The basemap's own buildings would overlap ours, so hide them.
    ["building", "building-3d"].forEach(id => map.getLayer(id) && map.setLayoutProperty(id, "visibility", "none"));
    const firstLabel = map.getStyle().layers.find(l => l.type === "symbol")?.id;
    const satellite = !!map.getSource("satellite");

    if (!map.getSource(BUILDINGS_SRC)) {
      map.addSource(BUILDINGS_SRC, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: OTHER_LAYER,
        type: "fill-extrusion",
        source: BUILDINGS_SRC,
        filter: ["!", ["has", "sev"]],
        paint: {
          "fill-extrusion-color": "#d6d1c7",
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "minHeight"],
          "fill-extrusion-opacity": satellite ? 0.35 : 0.85,
        },
      }, firstLabel);
      map.addLayer({
        id: SITE_LAYER,
        type: "fill-extrusion",
        source: BUILDINGS_SRC,
        filter: ["has", "sev"],
        paint: {
          "fill-extrusion-color": ["case",
            ["==", ["get", "selected"], true], SELECTED_COLOR,
            ["match", ["get", "sev"],
              "RED", SEVERITY_COLOR.RED, "YELLOW", SEVERITY_COLOR.YELLOW, "GREEN", SEVERITY_COLOR.GREEN, SEVERITY_COLOR.NONE]],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "minHeight"],
          "fill-extrusion-opacity": 0.92,
          "fill-extrusion-vertical-gradient": true,
        },
      }, firstLabel);

      map.addSource(ROUTE_SRC, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: ROUTE_SRC,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.9 },
      }, OTHER_LAYER);
      map.addLayer({
        id: "route-line",
        type: "line",
        source: ROUTE_SRC,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": SELECTED_COLOR, "line-width": 4.5, "line-dasharray": [2, 1.2] },
      }, OTHER_LAYER);
    }
  }, [styleVersion]);

  // Recolor buildings whenever statuses or the selection change.
  useEffect(() => {
    const src = mapRef.current?.getSource(BUILDINGS_SRC) as MapLibre.GeoJSONSource | undefined;
    const raw = rawBuildings.current;
    if (!src || !raw) return;
    src.setData({
      type: "FeatureCollection",
      features: raw.features.map(f => {
        const site = f.properties.name ? siteByBuilding.get(f.properties.name) : undefined;
        if (!site || !visible[site.severity]) return f;
        return { ...f, properties: { ...f.properties, sev: site.severity, siteKey: site.key, selected: site.key === selectedKey } };
      }),
    });
  }, [styleVersion, siteByBuilding, visible, selectedKey]);

  // Draw the optimized route along the walkways (hidden once it's out of date).
  useEffect(() => {
    const src = mapRef.current?.getSource(ROUTE_SRC) as MapLibre.GeoJSONSource | undefined;
    if (!src) return;
    src.setData({
      type: "FeatureCollection",
      features: plan && !planStale && plan.line.length > 1
        ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: plan.line } }]
        : [],
    });
  }, [styleVersion, plan, planStale]);

  // Pins. HTML markers survive basemap switches, so they only depend on data.
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!map || !lib || !styleVersion) return;
    markersRef.current.forEach(m => m.remove());

    const depotEl = document.createElement("div");
    depotEl.className = "map-depot";
    depotEl.textContent = "HQ";
    depotEl.title = `${depot.name} (route start)`;
    const markers = [new lib.Marker({ element: depotEl }).setLngLat([depot.lng, depot.lat]).addTo(map)];

    sites.filter(s => visible[s.severity]).forEach(s => {
      const n = stopNumber.get(s.key);
      // MapLibre positions the outer element with `transform`, so the
      // hover/selected scale goes on the inner button.
      const wrap = document.createElement("div");
      const el = document.createElement("button");
      el.type = "button";
      el.className = `map-pin map-pin-${s.severity.toLowerCase()}${s.key === selectedKey ? " selected" : ""}${s.severity === "RED" ? " big" : ""}${routeKeys.has(s.key) ? " in-route" : ""}`;
      el.textContent = n ? String(n) : "";
      el.title = `${s.building} · ${s.location} · ${SEVERITY_LABEL[s.severity]}`;
      el.setAttribute("aria-label", el.title);
      el.addEventListener("click", ev => { ev.stopPropagation(); onSiteClick.current(s.key); });
      wrap.appendChild(el);
      markers.push(new lib.Marker({ element: wrap }).setLngLat([s.lng, s.lat]).addTo(map));
    });
    markersRef.current = markers;
  }, [styleVersion > 0, sites, visible, routeKeys, stopNumber, selectedKey, depot]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3D tilt vs. flat top-down view.
  useEffect(() => {
    mapRef.current?.easeTo({ pitch: tilted ? 55 : 0, bearing: tilted ? -20 : 0, duration: 700 });
  }, [tilted]);

  function focus(site: MapSite) {
    setSelectedKey(site.key);
    const map = mapRef.current;
    map?.flyTo({ center: [site.lng, site.lat], zoom: Math.max(map.getZoom(), 17.5), duration: 900, essential: true });
  }

  return (
    <div className="map-layout">
      <div className="card map-card">
        <div className="map-toolbar">
          {SEVERITY_ORDER.map(sev => (
            <label key={sev} className="map-legend-item">
              <input type="checkbox" checked={visible[sev]} onChange={e => setVisible(v => ({ ...v, [sev]: e.target.checked }))} />
              <span className={`map-swatch map-pin-${sev.toLowerCase()}`} />
              {SEVERITY_LABEL[sev]} ({counts[sev]})
            </label>
          ))}
          <span className="map-toolbar-spacer" />
          <button type="button" className={pickMode ? "map-pick-btn active" : "map-pick-btn"} onClick={() => setPickMode(p => !p)} aria-pressed={pickMode}>
            {pickMode ? "Picking stops: tap buildings" : "Pick stops on map"}
          </button>
          <div className="map-segmented" role="group" aria-label="Basemap">
            <button type="button" className={basemap === "street" ? "active" : ""} onClick={() => setBasemap("street")}>Map</button>
            <button type="button" className={basemap === "satellite" ? "active" : ""} onClick={() => setBasemap("satellite")}>Satellite</button>
          </div>
          <div className="map-segmented" role="group" aria-label="View angle">
            <button type="button" className={tilted ? "active" : ""} onClick={() => setTilted(true)}>3D</button>
            <button type="button" className={!tilted ? "active" : ""} onClick={() => setTilted(false)}>2D</button>
          </div>
        </div>
        <div className="map-canvas-wrap">
          <div ref={mapEl} className="map-canvas" />
          {loadError && <div className="map-error">Couldn&apos;t load the map background ({loadError}). Check your internet connection.</div>}
        </div>
        <p className="map-hint">Drag to pan · right-click drag (or Ctrl + drag) to rotate and tilt · scroll to zoom. Buildings with a collection point are colored by status. Turn on &ldquo;Pick stops on map&rdquo; and tap buildings to add them to your route.</p>
      </div>

      <aside className="map-side">
        {selected ? (
          <SiteDetails
            site={selected}
            stop={stopNumber.get(selected.key)}
            inRoute={routeKeys.has(selected.key)}
            onToggleRoute={() => toggleStop(selected.key)}
            canViewRecords={canViewRecords}
            onClose={() => setSelectedKey(null)}
          />
        ) : (
          <div className="card map-panel">
            <h2>Select a site</h2>
            <p className="map-muted">Tap a colored building or a pin to see what&apos;s going on there.</p>
          </div>
        )}

        <div className="card map-panel">
          <h2>Plan a Route</h2>
          <p className="map-muted" style={{ marginTop: 0 }}>
            Pick the buildings you&apos;re going to, then press Optimize for the shortest walking loop from {depot.name}.
          </p>
          <div className="map-route-actions">
            <button type="button" className="btn btn-secondary btn-small" onClick={() => addAll("RED")} disabled={!counts.RED}>Add all red ({counts.RED})</button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => addAll("YELLOW")} disabled={!counts.YELLOW}>Add all yellow</button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => { setRouteKeys(new Set()); setPlan(null); }} disabled={!routeKeys.size}>Clear</button>
          </div>

          {routeKeys.size === 0 ? (
            <p className="map-muted">No stops picked yet. Tap a building or pin and choose &ldquo;Add to route&rdquo;, or turn on &ldquo;Pick stops on map&rdquo;.</p>
          ) : (
            <>
              <button type="button" className="btn map-optimize" onClick={optimize} disabled={!!plan && !planStale}>
                {plan && !planStale ? "Optimized ✓" : planStale ? `Re-optimize (${routeKeys.size} stops)` : `Optimize route (${routeKeys.size} stop${routeKeys.size === 1 ? "" : "s"})`}
              </button>
              {pathsReady === false && <p className="map-footnote">Walkway data didn&apos;t load, so the route uses straight lines.</p>}

              {plan && !planStale && (
                <p className="map-route-summary">
                  {plan.stops.length} stop{plan.stops.length === 1 ? "" : "s"} · {(plan.meters / 1609.34).toFixed(2)} mi · ~{plan.minutes} min
                  <small>{plan.walked ? "Along campus walkways" : "Straight-line estimate"}</small>
                </p>
              )}

              <ol className={plan && !planStale ? "map-route-list numbered" : "map-route-list"}>
                {plan && !planStale && <li className="map-route-depot">Start: {depot.name}</li>}
                {(plan && !planStale ? plan.stops : pickedSites).map(s => (
                  <li key={s.key}>
                    <button type="button" onClick={() => focus(s)} className={s.key === selectedKey ? "active" : ""}>
                      <span className={`map-swatch map-pin-${s.severity.toLowerCase()}`} />
                      <span>{s.building}<small>{s.location}</small></span>
                    </button>
                    <button type="button" className="map-route-remove" onClick={() => toggleStop(s.key)} aria-label={`Remove ${s.building} from route`}>×</button>
                  </li>
                ))}
                {plan && !planStale && <li className="map-route-depot">Return: {depot.name}</li>}
              </ol>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function SiteDetails({ site, stop, inRoute, onToggleRoute, canViewRecords, onClose }: {
  site: MapSite; stop?: number; inRoute: boolean; onToggleRoute: () => void; canViewRecords: boolean; onClose: () => void;
}) {
  return (
    <div className="card map-panel">
      <div className="map-panel-head">
        <div>
          <h2>{site.building}</h2>
          <div className="map-panel-sub">{site.location}</div>
        </div>
        <button type="button" className="map-close" onClick={onClose} aria-label="Close details">×</button>
      </div>

      <div className="map-badges">
        <span className={`status-chip status-${site.severity.toLowerCase()}`}>{SEVERITY_LABEL[site.severity]}</span>
        {stop && <span className="map-stop-badge">Route stop #{stop}</span>}
        {site.offCampus && <span className="map-stop-badge">Off campus</span>}
      </div>

      {site.issues.length > 0 && (
        <>
          <h3>Needs work</h3>
          <ul className="map-issues map-issues-red">{site.issues.map(i => <li key={i}>{i}</li>)}</ul>
        </>
      )}
      {site.warnings.length > 0 && (
        <>
          <h3>Watch</h3>
          <ul className="map-issues map-issues-yellow">{site.warnings.map(i => <li key={i}>{i}</li>)}</ul>
        </>
      )}

      <h3>Latest pickups</h3>
      {site.latest.length === 0 ? (
        <p className="map-muted">No pickups logged here for these filters.</p>
      ) : (
        <ul className="map-latest">
          {site.latest.map(r => (
            <li key={r.wasteStream}>
              <b>{r.wasteStream}</b> · {r.fullnessPercent}% full · {r.date} · {r.driverName}
              {r.comments && <div className="map-comment">&ldquo;{r.comments}&rdquo;</div>}
            </li>
          ))}
        </ul>
      )}

      {site.schedule.length > 0 && (
        <>
          <h3>Scheduled service</h3>
          <ul className="map-latest">{site.schedule.map(s => <li key={s}>{s}</li>)}</ul>
        </>
      )}

      <p className="map-muted">
        {site.pickupCount} pickup{site.pickupCount === 1 ? "" : "s"} in range
        {site.approx && " · pin position is approximate"}
      </p>
      <div className="map-detail-actions">
        <button type="button" className={inRoute ? "btn btn-secondary btn-small" : "btn btn-small"} onClick={onToggleRoute}>
          {inRoute ? "Remove from route" : "Add to route"}
        </button>
        {canViewRecords && <a className="btn btn-secondary btn-small" href={`/records?building=${encodeURIComponent(site.building)}`}>View records</a>}
      </div>
    </div>
  );
}
