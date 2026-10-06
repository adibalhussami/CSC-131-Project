package wastedashboard.service;

import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Reference list of campus buildings/locations, normalized from
 * "Sacramento State_ Service Overview.xlsx" (the current corrected service-location
 * list). Backs the survey form's location dropdown and the demo data seeder.
 */
@Component
public class CampusLocationCatalog {

    public record LocationOption(String building, String location) {
    }

    private static final List<LocationOption> LOCATIONS = List.of(
            new LocationOption("Alpine Hall", "ALPINE"),
            new LocationOption("Amador Hall", "AMADOR"),
            new LocationOption("Athletic Center", "ATHLETIC CENTER (FORM. STUDENT HEALTH)"),
            new LocationOption("Arboretum", "ARBORETUM *"),
            new LocationOption("Art Sculpture Lab", "ART SCULPTURE LAB"),
            new LocationOption("Brighton Hall", "BRIGHTON"),
            new LocationOption("Capistrano Hall", "CAPISTRANO"),
            new LocationOption("Facilities Management", "FACILITIES MANAGEMENT"),
            new LocationOption("Broad Field House", "BROAD FIELD HOUSE (ATHLETICS)"),
            new LocationOption("Kadema Hall", "KADEMA/LASSEN"),
            new LocationOption("Mariposa Hall", "MARIPOSA"),
            new LocationOption("Mendocino Hall", "MENDOCINO"),
            new LocationOption("Public Safety", "PUBLIC SAFETY (INSIDE FENCE)"),
            new LocationOption("Receiving/Mail/Reprographics", "RECEIVING/MAIL/REPROGRAPHICS"),
            new LocationOption("Riverside Engineering", "RIVERSIDE ENGINEERING"),
            new LocationOption("Sacramento Hall", "SACRAMENTO"),
            new LocationOption("Shasta Hall", "SHASTA HALL"),
            new LocationOption("Sequoia Hall", "SEQUOIA"),
            new LocationOption("Tahoe Hall", "TAHOE HALL"),
            new LocationOption("Tschannen Science Complex", "TSCHANNEN SCIENCE COMPLEX"),
            new LocationOption("Library", "LIBRARY - BOOK REC"),
            new LocationOption("Library", "LIBRARY CP"),
            new LocationOption("Library", "LIBRARY LOADING D"),
            new LocationOption("University Union", "UNIV UNION E.DOCK"),
            new LocationOption("University Union", "UNIVERSITY UNION"),
            new LocationOption("Dining Commons", "DINING COMMONS"),
            new LocationOption("Bookstore", "BOOKSTORE"),
            new LocationOption("Folsom Hall", "FOLSOM HALL"),
            new LocationOption("Modoc Hall", "MODOC HALL"),
            new LocationOption("Napa Hall", "NAPA HALL"),
            new LocationOption("Sierra Hall", "SIERRA HALL"),
            new LocationOption("American River Courtyard", "AMC NORTH"),
            new LocationOption("American River Courtyard", "AMC SOUTH"),
            new LocationOption("Desmond Hall", "DESMOND HALL"),
            new LocationOption("Draper Hall", "DRAPER HALL"),
            new LocationOption("Klamath Hall", "KLAMATH HALL"),
            new LocationOption("Mount Whitney Hall", "MT WHITNEY"),
            new LocationOption("Riverview Hall", "HOUSING-RIVERVIEW"),
            new LocationOption("Aquatic Center", "AQUATIC CENTER"),
            new LocationOption("Hornet Stadium", "HORNET STADIUM TM")
    );

    public List<LocationOption> all() {
        return LOCATIONS;
    }

    public List<String> buildings() {
        return LOCATIONS.stream()
                .map(LocationOption::building)
                .distinct()
                .sorted()
                .toList();
    }
}
