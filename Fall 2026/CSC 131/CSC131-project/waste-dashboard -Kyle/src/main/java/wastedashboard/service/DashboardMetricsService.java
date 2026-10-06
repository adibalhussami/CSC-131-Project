package wastedashboard.service;

import org.springframework.stereotype.Service;
import wastedashboard.model.ContaminationLevel;
import wastedashboard.model.FullnessStatus;
import wastedashboard.model.PickupRecord;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class DashboardMetricsService {

    private static final int TOP_PROBLEM_BUILDINGS_LIMIT = 10;
    private static final int NEEDS_ATTENTION_LIMIT = 10;

    private final PickupRecordService pickupRecordService;

    public DashboardMetricsService(PickupRecordService pickupRecordService) {
        this.pickupRecordService = pickupRecordService;
    }

    public DashboardMetrics computeMetrics(PickupRecordFilter filter) {
        List<PickupRecord> records = pickupRecordService.search(filter);

        long total = records.size();
        double averageFullness = records.stream()
                .mapToInt(PickupRecord::getFullnessPercent)
                .average()
                .orElse(0.0);

        long redCount = records.stream()
                .filter(r -> r.getFullnessStatus() == FullnessStatus.RED)
                .count();
        long contaminationCount = records.stream()
                .filter(r -> r.getContamination() != ContaminationLevel.NONE)
                .count();
        long overflowCount = records.stream()
                .filter(PickupRecord::isOverflow)
                .count();

        Map<FullnessStatus, Long> statusDistribution = records.stream()
                .collect(Collectors.groupingBy(PickupRecord::getFullnessStatus, Collectors.counting()));

        Map<String, Double> avgFullnessByBuilding = records.stream()
                .collect(Collectors.groupingBy(
                        PickupRecord::getBuilding,
                        TreeMap::new,
                        Collectors.averagingInt(PickupRecord::getFullnessPercent)));

        Map<String, Double> fullnessTrend = records.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getCollectionDate().toLocalDate().toString(),
                        TreeMap::new,
                        Collectors.averagingInt(PickupRecord::getFullnessPercent)));

        Map<String, Long> pickupCountTrend = records.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getCollectionDate().toLocalDate().toString(),
                        TreeMap::new,
                        Collectors.counting()));

        List<DashboardMetrics.BuildingProblemCount> topProblemBuildings = records.stream()
                .filter(r -> r.getFullnessStatus() == FullnessStatus.RED
                        || r.isOverflow()
                        || r.getContamination() != ContaminationLevel.NONE)
                .collect(Collectors.groupingBy(PickupRecord::getBuilding, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new DashboardMetrics.BuildingProblemCount(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(DashboardMetrics.BuildingProblemCount::problemCount).reversed())
                .limit(TOP_PROBLEM_BUILDINGS_LIMIT)
                .toList();

        List<PickupRecord> needsAttention = records.stream()
                .filter(r -> r.getFullnessStatus() == FullnessStatus.RED
                        || r.isOverflow()
                        || r.getContamination() != ContaminationLevel.NONE)
                .sorted(Comparator.comparing(PickupRecord::getCollectionDate).reversed())
                .limit(NEEDS_ATTENTION_LIMIT)
                .toList();

        return new DashboardMetrics(
                total,
                averageFullness,
                redCount,
                contaminationCount,
                overflowCount,
                new LinkedHashMap<>(statusDistribution),
                avgFullnessByBuilding,
                fullnessTrend,
                pickupCountTrend,
                topProblemBuildings,
                needsAttention
        );
    }
}
