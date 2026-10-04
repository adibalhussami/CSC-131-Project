package wastedashboard.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import wastedashboard.model.PickupRecord;

import java.util.List;

public interface PickupRecordRepository
        extends JpaRepository<PickupRecord, Long>, JpaSpecificationExecutor<PickupRecord> {

    @Query("select distinct p.building from PickupRecord p order by p.building asc")
    List<String> findDistinctBuildingByOrderByBuildingAsc();

    @Query("select distinct p.driverName from PickupRecord p order by p.driverName asc")
    List<String> findDistinctDriverNameByOrderByDriverNameAsc();
}
