package wastedashboard.service;

import wastedashboard.model.WasteStream;

import java.time.LocalDate;

public record PickupRecordFilter(
        String building,
        String driverName,
        WasteStream wasteStream,
        LocalDate from,
        LocalDate to
) {
}
