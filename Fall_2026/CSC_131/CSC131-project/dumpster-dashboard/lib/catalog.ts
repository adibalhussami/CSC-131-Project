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
