import { isStaff, requireFieldUser } from "@/lib/auth";
import { DEPOT_LOCATION, LOCATION_COORDS } from "@/lib/geo";
import { buildMapSites } from "@/lib/mapData";
import { distinctDrivers, parseFilter, searchRecords, type SearchParams } from "@/lib/records";
import { eyebrowDate } from "@/lib/time";
import FilterBar from "../FilterBar";
import CampusMap from "./CampusMap";

export const metadata = { title: "Campus Map" };

// Drivers can see the map too, to plan their route before heading out.
export default async function MapPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireFieldUser("/map");
  const staff = isStaff(session);
  const filter = parseFilter(await searchParams);
  const [records, drivers] = await Promise.all([searchRecords(filter), staff ? distinctDrivers() : Promise.resolve([])]);
  const sites = buildMapSites(records).filter(s => !filter.building || s.building === filter.building);

  return (
    <main>
      <p className="page-eyebrow"><span className="dot" /><span>Data as of {eyebrowDate(new Date())}</span></p>
      <h1 className="page-title">Campus Map</h1>
      <p className="page-intro">
        Buildings are colored by their most recent pickups: red needs work, yellow is worth watching.
        Tap one for details. To plan a route, pick the buildings you&apos;re visiting and press Optimize.
        You&apos;ll get the shortest loop along campus walkways, starting and ending at Facilities Management.
      </p>

      {staff && <FilterBar action="/map" filter={filter} drivers={drivers} />}

      <CampusMap
        sites={sites}
        depot={{ ...LOCATION_COORDS[DEPOT_LOCATION], name: "Facilities Management" }}
        canViewRecords={staff}
      />
    </main>
  );
}
