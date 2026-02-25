package com.groupwork.campus_facilities_booking.repository;

import com.groupwork.campus_facilities_booking.model.Entities.Booking;
import com.groupwork.campus_facilities_booking.model.Entities.Notification;
import com.groupwork.campus_facilities_booking.model.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);

    List<Notification> findByBooking(Booking booking);

    /**
     * Null out the booking reference on notifications that pointed at a booking
     * belonging to this facility. Preserves the notification text / history —
     * only the deep-link back to the booking is cleared.
     */
    @Modifying
    @Query("UPDATE Notification n SET n.booking = null WHERE n.booking.facility.id = :facilityId")
    void clearBookingReferencesByFacilityId(@Param("facilityId") Long facilityId);

    /**
     * Delete all notifications belonging to a user (called before user deletion).
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    /** Nullify booking ref on notifications whose booking was made by this user. */
    @Modifying
    @Query("UPDATE Notification n SET n.booking = null WHERE n.booking.user.id = :userId")
    void clearBookingReferencesByUserId(@Param("userId") Long userId);
}
