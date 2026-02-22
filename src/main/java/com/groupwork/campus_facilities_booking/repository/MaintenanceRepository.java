package com.groupwork.campus_facilities_booking.repository;

import com.groupwork.campus_facilities_booking.model.Entities.Facility;
import com.groupwork.campus_facilities_booking.model.Entities.MaintenanceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<MaintenanceSchedule, Long> {

    List<MaintenanceSchedule> findByFacility(Facility facility);

    // Returns schedules where today falls between startDate and endDate
    @Query("""
        SELECT m FROM MaintenanceSchedule m
        WHERE :date BETWEEN m.startDate AND m.endDate
    """)
    List<MaintenanceSchedule> findActiveOnDate(@Param("date") LocalDate date);

    // Used by BookingService — checks if a facility is under maintenance on a given date
    @Query("""
        SELECT m FROM MaintenanceSchedule m
        WHERE m.facility = :facility
          AND :date BETWEEN m.startDate AND m.endDate
    """)
    List<MaintenanceSchedule> findByFacilityAndDateRange(
            @Param("facility") Facility facility,
            @Param("date")     LocalDate date);
}
