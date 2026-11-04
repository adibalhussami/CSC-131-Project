import { WasteStream } from "@prisma/client";

// Reference list of campus buildings/locations, normalized from
// "Sacramento State_ Service Overview.xlsx". Backs the pickup form's location
// dropdown, the building filter and the demo data seeder.
export type LocationOption = { building: string; location: string };

export const LOCATIONS: LocationOption[] = [
  { building: "Alpine Hall", location: "ALPINE" },
  { building: "Amador Hall", location: "AMADOR" },
  { building: "Athletic Center", location: "ATHLETIC CENTER (FORM. STUDENT HEALTH)" },
  { building: "Arboretum", location: "ARBORETUM *" },
  { building: "Art Sculpture Lab", location: "ART SCULPTURE LAB" },
  { building: "Brighton Hall", location: "BRIGHTON" },
  { building: "Capistrano Hall", location: "CAPISTRANO" },
  { building: "Facilities Management", location: "FACILITIES MANAGEMENT" },
  { building: "Broad Field House", location: "BROAD FIELD HOUSE (ATHLETICS)" },
  { building: "Kadema Hall", location: "KADEMA/LASSEN" },
  { building: "Mariposa Hall", location: "MARIPOSA" },
  { building: "Mendocino Hall", location: "MENDOCINO" },
  { building: "Public Safety", location: "PUBLIC SAFETY (INSIDE FENCE)" },
  { building: "Receiving/Mail/Reprographics", location: "RECEIVING/MAIL/REPROGRAPHICS" },
  { building: "Riverside Engineering", location: "RIVERSIDE ENGINEERING" },
  { building: "Sacramento Hall", location: "SACRAMENTO" },
  { building: "Shasta Hall", location: "SHASTA HALL" },
  { building: "Sequoia Hall", location: "SEQUOIA" },
  { building: "Tahoe Hall", location: "TAHOE HALL" },
  { building: "Tschannen Science Complex", location: "TSCHANNEN SCIENCE COMPLEX" },
  { building: "Library", location: "LIBRARY - BOOK REC" },
  { building: "Library", location: "LIBRARY CP" },
  { building: "Library", location: "LIBRARY LOADING D" },
  { building: "University Union", location: "UNIV UNION E.DOCK" },
  { building: "University Union", location: "UNIVERSITY UNION" },
  { building: "Dining Commons", location: "DINING COMMONS" },
  { building: "Bookstore", location: "BOOKSTORE" },
  { building: "Folsom Hall", location: "FOLSOM HALL" },
  { building: "Modoc Hall", location: "MODOC HALL" },
  { building: "Napa Hall", location: "NAPA HALL" },
  { building: "Sierra Hall", location: "SIERRA HALL" },
  { building: "American River Courtyard", location: "AMC NORTH" },
  { building: "American River Courtyard", location: "AMC SOUTH" },
  { building: "Desmond Hall", location: "DESMOND HALL" },
  { building: "Draper Hall", location: "DRAPER HALL" },
  { building: "Klamath Hall", location: "KLAMATH HALL" },
  { building: "Mount Whitney Hall", location: "MT WHITNEY" },
  { building: "Riverview Hall", location: "HOUSING-RIVERVIEW" },
  { building: "Aquatic Center", location: "AQUATIC CENTER" },
  { building: "Hornet Stadium", location: "HORNET STADIUM TM" },
];

export const BUILDINGS = [...new Set(LOCATIONS.map(l => l.building))].sort();

export const BUILDING_BY_LOCATION: Record<string, string> = Object.fromEntries(
  LOCATIONS.map(l => [l.location, l.building]),
);

// Scheduled weekly service levels per location, normalized from the "UPDATED"
// sheet of "Sacramento State_ Service Overview.xlsx" (container qty + weekly
// pickup frequency, per waste stream). Locations serviced only on an
// as-needed/event basis (roll-offs, "-" frequency) are omitted, since there's
// no regular weekly schedule to compare actual pickups against. Shasta Hall's
// row was blank on the UPDATED sheet, so its numbers come from the ORIGINAL
// sheet instead. Used by lib/costMetrics.ts for the Cost page's "scheduled vs
// actual" comparison.
export type ServiceLevel = { containerQty: number; pickupsPerWeek: number };
export type LocationServiceLevels = Partial<Record<WasteStream, ServiceLevel>>;

export const SERVICE_LEVELS: Record<string, LocationServiceLevels> = {
  ALPINE: { LANDFILL: { containerQty: 2, pickupsPerWeek: 3 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  AMADOR: { LANDFILL: { containerQty: 1, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "ATHLETIC CENTER (FORM. STUDENT HEALTH)": { LANDFILL: { containerQty: 1, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "ARBORETUM *": { ORGANICS: { containerQty: 1, pickupsPerWeek: 2 } },
  "ART SCULPTURE LAB": { LANDFILL: { containerQty: 1, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  BRIGHTON: { LANDFILL: { containerQty: 1, pickupsPerWeek: 3 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  CAPISTRANO: { LANDFILL: { containerQty: 1, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "FACILITIES MANAGEMENT": { LANDFILL: { containerQty: 2, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "BROAD FIELD HOUSE (ATHLETICS)": { LANDFILL: { containerQty: 2, pickupsPerWeek: 3 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 2 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "KADEMA/LASSEN": { LANDFILL: { containerQty: 4, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 2, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  MARIPOSA: { LANDFILL: { containerQty: 2, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 2, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  MENDOCINO: { LANDFILL: { containerQty: 1, pickupsPerWeek: 3 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "PUBLIC SAFETY (INSIDE FENCE)": { LANDFILL: { containerQty: 1, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "RECEIVING/MAIL/REPROGRAPHICS": { LANDFILL: { containerQty: 1, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "RIVERSIDE ENGINEERING": { LANDFILL: { containerQty: 2, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  SACRAMENTO: { LANDFILL: { containerQty: 2, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "SHASTA HALL": { LANDFILL: { containerQty: 2, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  SEQUOIA: { LANDFILL: { containerQty: 2, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "TAHOE HALL": { LANDFILL: { containerQty: 3, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "TSCHANNEN SCIENCE COMPLEX": { LANDFILL: { containerQty: 1, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 2, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "LIBRARY - BOOK REC": { ORGANICS: { containerQty: 2, pickupsPerWeek: 1 } },
  "LIBRARY CP": { LANDFILL: { containerQty: 1, pickupsPerWeek: 1 } },
  "UNIV UNION E.DOCK": { LANDFILL: { containerQty: 1, pickupsPerWeek: 1 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 3 }, ORGANICS: { containerQty: 2, pickupsPerWeek: 1 } },
  "UNIVERSITY UNION": { LANDFILL: { containerQty: 1, pickupsPerWeek: 1 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 3 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 3 } },
  "DINING COMMONS": { LANDFILL: { containerQty: 1, pickupsPerWeek: 3 }, RECYCLING: { containerQty: 2, pickupsPerWeek: 3 } },
  BOOKSTORE: { RECYCLING: { containerQty: 1, pickupsPerWeek: 3 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "FOLSOM HALL": { LANDFILL: { containerQty: 2, pickupsPerWeek: 6 }, RECYCLING: { containerQty: 2, pickupsPerWeek: 3 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "MODOC HALL": { RECYCLING: { containerQty: 1, pickupsPerWeek: 3 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "NAPA HALL": { RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "SIERRA HALL": { LANDFILL: { containerQty: 1, pickupsPerWeek: 4 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 2 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "AMC NORTH": { LANDFILL: { containerQty: 2, pickupsPerWeek: 4 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 3 }, ORGANICS: { containerQty: 2, pickupsPerWeek: 1 } },
  "AMC SOUTH": { LANDFILL: { containerQty: 3, pickupsPerWeek: 4 }, RECYCLING: { containerQty: 2, pickupsPerWeek: 3 } },
  "DESMOND HALL": { LANDFILL: { containerQty: 1, pickupsPerWeek: 4 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 2 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "DRAPER HALL": { LANDFILL: { containerQty: 1, pickupsPerWeek: 4 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 2 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "KLAMATH HALL": { LANDFILL: { containerQty: 1, pickupsPerWeek: 4 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 2 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  "MT WHITNEY": { LANDFILL: { containerQty: 5, pickupsPerWeek: 4 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 3 }, ORGANICS: { containerQty: 2, pickupsPerWeek: 1 } },
  "AQUATIC CENTER": { LANDFILL: { containerQty: 1, pickupsPerWeek: 2 }, RECYCLING: { containerQty: 1, pickupsPerWeek: 1 }, ORGANICS: { containerQty: 1, pickupsPerWeek: 1 } },
  // LIBRARY LOADING D, HOUSING-RIVERVIEW and HORNET STADIUM TM are roll-off/
  // event-only service with no weekly schedule, so they're intentionally left
  // out of this table.
};
