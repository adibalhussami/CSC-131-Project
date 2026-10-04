package wastedashboard.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import wastedashboard.model.ContaminationLevel;
import wastedashboard.model.PickupRecord;
import wastedashboard.model.WasteStream;
import wastedashboard.repository.PickupRecordRepository;
import wastedashboard.service.CampusLocationCatalog;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

/**
 * Seeds demo pickup records on first run so the dashboard has real-looking content
 * immediately, mirroring the "simulated data" used while the project was still on
 * Google Sheets (see CSC131_dashboard_progress_log.md).
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final int SEED_COUNT = 50;
    private static final List<String> DRIVERS = List.of("Laura", "Mohd", "Connor", "Ali", "Priya");
    private static final WasteStream[] STREAMS = WasteStream.values();
    private static final int[] FULLNESS_VALUES = {0, 25, 50, 75, 100};

    private final PickupRecordRepository repository;
    private final CampusLocationCatalog campusLocationCatalog;

    public DataSeeder(PickupRecordRepository repository, CampusLocationCatalog campusLocationCatalog) {
        this.repository = repository;
        this.campusLocationCatalog = campusLocationCatalog;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            return;
        }

        List<CampusLocationCatalog.LocationOption> locations = campusLocationCatalog.all();
        Random random = new Random(42);

        for (int i = 0; i < SEED_COUNT; i++) {
            CampusLocationCatalog.LocationOption location = locations.get(random.nextInt(locations.size()));

            PickupRecord record = new PickupRecord();
            record.setCollectionDate(LocalDateTime.now().minusDays(random.nextInt(30)).minusHours(random.nextInt(12)));
            record.setBuilding(location.building());
            record.setLocation(location.location());
            record.setBinId("SIM-%03d".formatted(i + 1));
            record.setDriverName(DRIVERS.get(random.nextInt(DRIVERS.size())));
            record.setWasteStream(STREAMS[random.nextInt(STREAMS.length)]);
            record.setFullnessPercent(FULLNESS_VALUES[random.nextInt(FULLNESS_VALUES.length)]);
            record.setContamination(randomContamination(random));
            record.setOverflow(record.getFullnessPercent() == 100 && random.nextInt(3) == 0);
            record.setComments(record.isOverflow() ? "Waste piled outside the bin." : "");

            repository.save(record);
        }
    }

    private ContaminationLevel randomContamination(Random random) {
        int roll = random.nextInt(10);
        if (roll < 7) {
            return ContaminationLevel.NONE;
        }
        if (roll < 9) {
            return ContaminationLevel.A_LITTLE;
        }
        return ContaminationLevel.A_LOT;
    }
}
