package com.groupwork.campus_facilities_booking.repository;

import com.groupwork.campus_facilities_booking.model.Entities.Booking;
import com.groupwork.campus_facilities_booking.model.Enums.BookingStatus;
import com.groupwork.campus_facilities_booking.model.Entities.Facility;
import com.groupwork.campus_facilities_booking.model.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserOrderByDateDescStartTimeDesc(User user);

    List<Booking> findByFacility(Facility facility);

    List<Booking> findByFacilityAndDate(Facility facility, LocalDate date);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByDateAndStatus(LocalDate date, BookingStatus status);

    List<Booking> findByFacilityAndDateAndStatusIn(
            Facility facility, LocalDate date, List<BookingStatus> statuses);

    /**
     * The critical conflict-detection query.
     * Returns any existing booking for the same facility + date whose time
     * window overlaps with the requested [startTime, endTime] range.
     *
     * Two ranges overlap when:  existingStart < newEnd  AND  existingEnd > newStart
     */
    @Query("""
        SELECT b FROM Booking b
        WHERE b.facility   = :facility
          AND b.date       = :date
          AND b.status     IN :statuses
          AND b.startTime  < :endTime
          AND b.endTime    > :startTime
    """)
    List<Booking> findConflictingBookings(
            @Param("facility")   Facility facility,
            @Param("date")       LocalDate date,
            @Param("startTime")  LocalTime startTime,
            @Param("endTime")    LocalTime endTime,
            @Param("statuses")   List<BookingStatus> statuses);

    /**
     * Find all bookings with any of the given statuses.
     * Used for auto-expiry and reminder scheduling.
     */
    List<Booking> findByStatusIn(List<BookingStatus> statuses);
}
