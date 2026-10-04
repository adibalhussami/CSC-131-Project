package wastedashboard.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import wastedashboard.model.WasteStream;
import wastedashboard.service.CampusLocationCatalog;
import wastedashboard.service.DashboardMetricsService;
import wastedashboard.service.PickupRecordFilter;
import wastedashboard.service.PickupRecordService;

import java.time.LocalDate;

@Controller
public class DashboardController {

    private final DashboardMetricsService dashboardMetricsService;
    private final PickupRecordService pickupRecordService;
    private final CampusLocationCatalog campusLocationCatalog;

    public DashboardController(
            DashboardMetricsService dashboardMetricsService,
            PickupRecordService pickupRecordService,
            CampusLocationCatalog campusLocationCatalog
    ) {
        this.dashboardMetricsService = dashboardMetricsService;
        this.pickupRecordService = pickupRecordService;
        this.campusLocationCatalog = campusLocationCatalog;
    }

    @GetMapping("/")
    public String dashboard(
            @RequestParam(required = false) String building,
            @RequestParam(required = false) String driverName,
            @RequestParam(required = false) WasteStream wasteStream,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            Model model
    ) {
        PickupRecordFilter filter = new PickupRecordFilter(building, driverName, wasteStream, from, to);
        model.addAttribute("metrics", dashboardMetricsService.computeMetrics(filter));
        model.addAttribute("filter", filter);
        model.addAttribute("buildings", campusLocationCatalog.buildings());
        model.addAttribute("drivers", pickupRecordService.distinctDrivers());
        model.addAttribute("wasteStreams", WasteStream.values());
        return "index";
    }
}
