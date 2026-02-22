package com.groupwork.campus_facilities_booking.service;

import com.groupwork.campus_facilities_booking.model.Entities.Booking;
import com.groupwork.campus_facilities_booking.model.Entities.Facility;
import com.groupwork.campus_facilities_booking.model.Entities.Review;
import com.groupwork.campus_facilities_booking.model.Entities.User;
import com.groupwork.campus_facilities_booking.model.Enums.BookingStatus;
import com.groupwork.campus_facilities_booking.model.Enums.UserRole;
import com.groupwork.campus_facilities_booking.repository.BookingRepository;
import com.groupwork.campus_facilities_booking.repository.FacilityRepository;
import com.groupwork.campus_facilities_booking.repository.ReviewRepository;
import com.groupwork.campus_facilities_booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository   reviewRepository;
    private final FacilityRepository facilityRepository;
    private final BookingRepository  bookingRepository;
    private final UserRepository     userRepository;

    // ── Get all reviews for a facility ────────────────────────
    public List<Review> getReviewsByFacility(Long facilityId) {
        Facility facility = facilityRepository.findById(facilityId)
            .orElseThrow(() -> new RuntimeException("Facility not found with id: " + facilityId));
        return reviewRepository.findByFacilityOrderByCreatedAtDesc(facility);
    }

    // ── Get average star rating for a facility ────────────────
    public Map<String, Object> getAverageRating(Long facilityId) {
        Facility facility = facilityRepository.findById(facilityId)
            .orElseThrow(() -> new RuntimeException("Facility not found with id: " + facilityId));

        List<Review> reviews = reviewRepository.findByFacility(facility);
        double average = reviews.stream()
            .mapToInt(Review::getRating)
            .average()
            .orElse(0.0);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("facilityId",    facilityId);
        result.put("facilityName",  facility.getName());
        result.put("averageRating", Math.round(average * 10.0) / 10.0); // 1 decimal place
        result.put("totalReviews",  reviews.size());
        return result;
    }

    // ── Get current user's reviews ────────────────────────────
    public List<Review> getReviewsForCurrentUser() {
        User user = getCurrentUser();
        return reviewRepository.findByUserOrderByCreatedAtDesc(user);
    }

    // ── Submit a review ───────────────────────────────────────
    @Transactional
    public Review submitReview(Review request) {
        User user = getCurrentUser();

        // Find the booking
        Booking booking = bookingRepository.findById(request.getBooking().getId())
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Only allow reviews for COMPLETED bookings
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException(
                "You can only review a facility after your booking is completed.");
        }

        // Make sure the review is from the person who made the booking
        if (!booking.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only review your own bookings.");
        }

        // Prevent duplicate reviews for the same booking
        if (reviewRepository.existsByBooking(booking)) {
            throw new RuntimeException("You have already submitted a review for this booking.");
        }

        Facility facility = facilityRepository.findById(request.getFacility().getId())
            .orElseThrow(() -> new RuntimeException("Facility not found"));

        Review review = Review.builder()
            .facility(facility)
            .user(user)
            .booking(booking)
            .rating(request.getRating())
            .comment(request.getComment())
            .build();

        return reviewRepository.save(review);
    }

    // ── Delete a review ───────────────────────────────────────
    @Transactional
    public void deleteReview(Long id) {
        Review review = reviewRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));

        User currentUser = getCurrentUser();
        // Only the author or an admin can delete
        if (!review.getUser().getId().equals(currentUser.getId()) &&
            currentUser.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("You are not authorised to delete this review.");
        }

        reviewRepository.delete(review);
    }

    // ── Helper ────────────────────────────────────────────────
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }
}
