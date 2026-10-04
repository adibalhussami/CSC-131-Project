package wastedashboard.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import wastedashboard.model.ContaminationLevel;
import wastedashboard.model.PickupRecord;
import wastedashboard.model.WasteStream;
import wastedashboard.service.CampusLocationCatalog;
import wastedashboard.service.PickupRecordFilter;
import wastedashboard.service.PickupRecordService;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;

@Controller
public class PickupRecordController {

    private final PickupRecordService pickupRecordService;
    private final CampusLocationCatalog campusLocationCatalog;

    public PickupRecordController(
            PickupRecordService pickupRecordService,
            CampusLocationCatalog campusLocationCatalog
    ) {
        this.pickupRecordService = pickupRecordService;
        this.campusLocationCatalog = campusLocationCatalog;
    }

    @GetMapping("/records/new")
    public String newRecordForm(
            @RequestParam(required = false) Boolean submitted,
            Model model
    ) {
        model.addAttribute("pickupRecord", new PickupRecord());
        model.addAttribute("locations", campusLocationCatalog.all());
        model.addAttribute("wasteStreams", WasteStream.values());
        model.addAttribute("contaminationLevels", ContaminationLevel.values());
        model.addAttribute("submitted", Boolean.TRUE.equals(submitted));
        return "record_form";
    }

    @PostMapping("/records")
    public String submitRecord(@ModelAttribute PickupRecord pickupRecord) {
        pickupRecordService.create(pickupRecord);
        return "redirect:/records/new?submitted=true";
    }

    @GetMapping("/records")
    public String listRecords(
            @RequestParam(required = false) String building,
            @RequestParam(required = false) String driverName,
            @RequestParam(required = false) WasteStream wasteStream,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            Model model
    ) {
        PickupRecordFilter filter = new PickupRecordFilter(building, driverName, wasteStream, from, to);
        model.addAttribute("records", pickupRecordService.search(filter));
        model.addAttribute("filter", filter);
        model.addAttribute("buildings", campusLocationCatalog.buildings());
        model.addAttribute("drivers", pickupRecordService.distinctDrivers());
        model.addAttribute("wasteStreams", WasteStream.values());
        return "records";
    }

    @GetMapping("/records/export.csv")
    public void exportCsv(
            @RequestParam(required = false) String building,
            @RequestParam(required = false) String driverName,
            @RequestParam(required = false) WasteStream wasteStream,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            HttpServletResponse response
    ) throws IOException {
        PickupRecordFilter filter = new PickupRecordFilter(building, driverName, wasteStream, from, to);
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"pickup-records.csv\"");
        try (PrintWriter writer = response.getWriter()) {
            writer.write(pickupRecordService.exportCsv(filter));
        }
    }

    @PostMapping("/records/import")
    public String importCsv(@RequestParam("file") MultipartFile file, RedirectAttributes redirectAttributes) {
        int imported = pickupRecordService.importCsv(file);
        redirectAttributes.addFlashAttribute("importedCount", imported);
        return "redirect:/records";
    }
}
