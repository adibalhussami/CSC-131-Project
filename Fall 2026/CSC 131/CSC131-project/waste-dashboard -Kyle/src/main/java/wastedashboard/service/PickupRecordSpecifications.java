package wastedashboard.service;

import org.springframework.data.jpa.domain.Specification;
import wastedashboard.model.PickupRecord;

import java.time.LocalDateTime;

final class PickupRecordSpecifications {

    private PickupRecordSpecifications() {
    }

    static Specification<PickupRecord> matching(PickupRecordFilter filter) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (filter.building() != null && !filter.building().isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("building"), filter.building()));
            }
            if (filter.driverName() != null && !filter.driverName().isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("driverName"), filter.driverName()));
            }
            if (filter.wasteStream() != null) {
                predicate = cb.and(predicate, cb.equal(root.get("wasteStream"), filter.wasteStream()));
            }
            if (filter.from() != null) {
                predicate = cb.and(predicate,
                        cb.greaterThanOrEqualTo(root.get("collectionDate"), filter.from().atStartOfDay()));
            }
            if (filter.to() != null) {
                LocalDateTime endOfDay = filter.to().plusDays(1).atStartOfDay();
                predicate = cb.and(predicate, cb.lessThan(root.get("collectionDate"), endOfDay));
            }

            return predicate;
        };
    }
}
