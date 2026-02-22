package com.groupwork.campus_facilities_booking.controller;

import com.groupwork.campus_facilities_booking.model.Entities.Review;
import com.groupwork.campus_facilities_booking.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Facility Reviews.
 *
 * GET    /reviews/facility/{facilityId}   → all reviews for a facility (public)
 * GET    /reviews/facility/{id}/rating    → average star rating for a facility
 * GET    /reviews/my                      → current user's reviews
 * POST   /reviews                         → submit a review (after COMPLETED booking)
 * DELETE /reviews/{id}                    → delete own review / ADMIN deletes any
 */
@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewService reviewService;

    // ── GET /reviews/facility/{facilityId} ───────────────────
    @GetMapping("/facility/{facilityId}")
    public ResponseEntity<List<Review>> getReviewsByFacility(@PathVariable Long facilityId) {
        return ResponseEntity.ok(reviewService.getReviewsByFacility(facilityId));
    }

    // ── GET /reviews/facility/{facilityId}/rating ────────────
    // Returns: { "facilityId": 3, "averageRating": 4.2, "totalReviews": 15 }
    @GetMapping("/facility/{facilityId}/rating")
    public ResponseEntity<Map<String, Object>> getAverageRating(
            @PathVariable Long facilityId) {
        return ResponseEntity.ok(reviewService.getAverageRating(facilityId));
    }

    // ── GET /reviews/my ──────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<List<Review>> getMyReviews() {
        return ResponseEntity.ok(reviewService.getReviewsForCurrentUser());
    }

    // ── POST /reviews ────────────────────────────────────────
    // Body: { bookingId, facilityId, rating (1–5), comment }
    // Only allowed if booking status is COMPLETED
    @PostMapping
    public ResponseEntity<Review> submitReview(@Valid @RequestBody Review review) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.submitReview(review));
    }

    // ── DELETE /reviews/{id} ─────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
