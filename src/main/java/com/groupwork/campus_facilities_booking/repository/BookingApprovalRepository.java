package com.groupwork.campus_facilities_booking.repository;

import com.groupwork.campus_facilities_booking.model.Entities.Booking;
import com.groupwork.campus_facilities_booking.model.Entities.BookingApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingApprovalRepository extends JpaRepository<BookingApproval, Long> {

    List<BookingApproval> findByBooking(Booking booking);

    /** Delete all approvals whose parent booking belongs to the given facility. */
    @Modifying
    @Query("DELETE FROM BookingApproval ba WHERE ba.booking.facility.id = :facilityId")
    void deleteAllByFacilityId(@Param("facilityId") Long facilityId);

    /** Delete all approvals for bookings made by this user. */
    @Modifying
    @Query("DELETE FROM BookingApproval ba WHERE ba.booking.user.id = :userId")
    void deleteAllByBookingUserId(@Param("userId") Long userId);

    /** Nullify reviewed_by when the reviewing admin is deleted. */
    @Modifying
    @Query("UPDATE BookingApproval ba SET ba.reviewedBy = null WHERE ba.reviewedBy.id = :userId")
    void nullifyReviewedBy(@Param("userId") Long userId);
}
