package com.groupwork.campus_facilities_booking.repository;

import com.groupwork.campus_facilities_booking.model.Entities.Facility;
import com.groupwork.campus_facilities_booking.model.Entities.User;
import com.groupwork.campus_facilities_booking.model.Entities.WaitlistEntry;
import com.groupwork.campus_facilities_booking.model.Enums.WaitlistStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface WaitlistRepository extends JpaRepository<WaitlistEntry, Long> {

    List<WaitlistEntry> findByUserAndStatus(User user, WaitlistStatus status);

    List<WaitlistEntry> findByFacilityAndStatusOrderByPositionAsc(
            Facility facility, WaitlistStatus status);

    // Used by BookingService to promote waitlist after a cancellation
    List<WaitlistEntry> findByFacilityAndDateAndStartTimeAndStatusOrderByPositionAsc(
            Facility facility, LocalDate date, LocalTime startTime, WaitlistStatus status);

    // Used by WaitlistService to shift queue positions
    List<WaitlistEntry> findByFacilityAndDateAndStartTimeAndStatusAndPositionGreaterThan(
            Facility facility, LocalDate date, LocalTime startTime,
            WaitlistStatus status, Integer position);

    boolean existsByFacilityAndUserAndDateAndStartTime(
            Facility facility, User user, LocalDate date, LocalTime startTime);

    int countByFacilityAndDateAndStartTimeAndStatus(
            Facility facility, LocalDate date, LocalTime startTime, WaitlistStatus status);
}
