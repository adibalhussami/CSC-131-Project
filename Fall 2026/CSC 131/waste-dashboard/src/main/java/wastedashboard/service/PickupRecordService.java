package wastedashboard.service;

import com.opencsv.CSVReader;
import com.opencsv.CSVWriter;
import com.opencsv.exceptions.CsvValidationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import wastedashboard.model.ContaminationLevel;
import wastedashboard.model.PickupRecord;
import wastedashboard.model.WasteStream;
import wastedashboard.repository.PickupRecordRepository;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PickupRecordService {

    private static final DateTimeFormatter CSV_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private static final String[] CSV_HEADER = {
            "collectionDate", "building", "location", "binId", "driverName",
            "wasteStream", "fullnessPercent", "contamination", "overflow", "comments"
    };

    private final PickupRecordRepository repository;

    public PickupRecordService(PickupRecordRepository repository) {
        this.repository = repository;
    }

    public PickupRecord create(PickupRecord record) {
        if (record.getCollectionDate() == null) {
            record.setCollectionDate(LocalDateTime.now());
        }
        return repository.save(record);
    }

    public List<PickupRecord> search(PickupRecordFilter filter) {
        return repository.findAll(
                PickupRecordSpecifications.matching(filter),
                org.springframework.data.domain.Sort.by("collectionDate").descending());
    }

    public List<String> distinctBuildings() {
        return repository.findDistinctBuildingByOrderByBuildingAsc();
    }

    public List<String> distinctDrivers() {
        return repository.findDistinctDriverNameByOrderByDriverNameAsc();
    }

    public String exportCsv(PickupRecordFilter filter) {
        List<PickupRecord> records = search(filter);
        StringWriter stringWriter = new StringWriter();
        try (CSVWriter writer = new CSVWriter(stringWriter)) {
            writer.writeNext(CSV_HEADER);
            for (PickupRecord record : records) {
                writer.writeNext(new String[]{
                        record.getCollectionDate().format(CSV_DATE_FORMAT),
                        record.getBuilding(),
                        record.getLocation(),
                        record.getBinId(),
                        record.getDriverName(),
                        record.getWasteStream().name(),
                        String.valueOf(record.getFullnessPercent()),
                        record.getContamination().name(),
                        String.valueOf(record.isOverflow()),
                        record.getComments()
                });
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return stringWriter.toString();
    }

    public int importCsv(MultipartFile file) {
        int imported = 0;
        try (CSVReader reader = new CSVReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String[] row = reader.readNext();
            if (row == null) {
                return 0;
            }
            while ((row = reader.readNext()) != null) {
                if (row.length < CSV_HEADER.length) {
                    continue;
                }
                PickupRecord record = new PickupRecord();
                record.setCollectionDate(LocalDateTime.parse(row[0].trim(), CSV_DATE_FORMAT));
                record.setBuilding(row[1].trim());
                record.setLocation(row[2].trim());
                record.setBinId(row[3].trim());
                record.setDriverName(row[4].trim());
                record.setWasteStream(WasteStream.valueOf(row[5].trim().toUpperCase()));
                record.setFullnessPercent(Integer.parseInt(row[6].trim()));
                record.setContamination(ContaminationLevel.valueOf(row[7].trim().toUpperCase()));
                record.setOverflow(Boolean.parseBoolean(row[8].trim()));
                record.setComments(row.length > 9 ? row[9] : "");
                repository.save(record);
                imported++;
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        } catch (CsvValidationException e) {
            throw new IllegalArgumentException("Malformed CSV file", e);
        }
        return imported;
    }
}
