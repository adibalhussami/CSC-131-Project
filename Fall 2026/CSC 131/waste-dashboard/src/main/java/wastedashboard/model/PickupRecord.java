package wastedashboard.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "pickup_record")
public class PickupRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime collectionDate;

    @Column(nullable = false)
    private String building;

    @Column(nullable = false)
    private String location;

    private String binId;

    @Column(nullable = false)
    private String driverName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WasteStream wasteStream;

    @Column(nullable = false)
    private int fullnessPercent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FullnessStatus fullnessStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContaminationLevel contamination;

    @Column(nullable = false)
    private boolean overflow;

    @Column(length = 1000)
    private String comments;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getCollectionDate() {
        return collectionDate;
    }

    public void setCollectionDate(LocalDateTime collectionDate) {
        this.collectionDate = collectionDate;
    }

    public String getBuilding() {
        return building;
    }

    public void setBuilding(String building) {
        this.building = building;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getBinId() {
        return binId;
    }

    public void setBinId(String binId) {
        this.binId = binId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public WasteStream getWasteStream() {
        return wasteStream;
    }

    public void setWasteStream(WasteStream wasteStream) {
        this.wasteStream = wasteStream;
    }

    public int getFullnessPercent() {
        return fullnessPercent;
    }

    public void setFullnessPercent(int fullnessPercent) {
        this.fullnessPercent = fullnessPercent;
        this.fullnessStatus = FullnessStatus.fromPercent(fullnessPercent);
    }

    public FullnessStatus getFullnessStatus() {
        return fullnessStatus;
    }

    public ContaminationLevel getContamination() {
        return contamination;
    }

    public void setContamination(ContaminationLevel contamination) {
        this.contamination = contamination;
    }

    public boolean isOverflow() {
        return overflow;
    }

    public void setOverflow(boolean overflow) {
        this.overflow = overflow;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }
}
