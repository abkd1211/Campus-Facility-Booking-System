package com.groupwork.campus_facilities_booking.repository;

import com.groupwork.campus_facilities_booking.model.Entities.Booking;
import com.groupwork.campus_facilities_booking.model.Entities.Facility;
import com.groupwork.campus_facilities_booking.model.Entities.Review;
import com.groupwork.campus_facilities_booking.model.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByFacility(Facility facility);

    List<Review> findByFacilityOrderByCreatedAtDesc(Facility facility);

    List<Review> findByUserOrderByCreatedAtDesc(User user);

    boolean existsByBooking(Booking booking);
}
