package wastedashboard.service;

import wastedashboard.model.FullnessStatus;
import wastedashboard.model.PickupRecord;

import java.util.List;
import java.util.Map;

public record DashboardMetrics(
        long totalPickups,
        double averageFullness,
        long redCount,
        long contaminationCount,
        long overflowCount,
        Map<FullnessStatus, Long> statusDistribution,
        Map<String, Double> averageFullnessByBuilding,
        Map<String, Double> fullnessTrend,
        Map<String, Long> pickupCountTrend,
        List<BuildingProblemCount> topProblemBuildings,
        List<PickupRecord> needsAttention
) {
    public record BuildingProblemCount(String building, long problemCount) {
    }
}
