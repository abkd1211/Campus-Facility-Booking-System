package com.groupwork.campus_facilities_booking.model.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A user's rating and review of a facility, submitted after a COMPLETED booking.
 *
 * This feeds into a facility's average rating, visible on the frontend
 * to help other users choose between spaces.
 *
 * Only one review per booking is allowed (unique constraint on booking_id).
 */
@Entity
@Table(
    name = "reviews",
    indexes = {
        @Index(name = "idx_reviews_facility", columnList = "facility_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** One review per booking — prevents duplicate submissions. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer rating;                // 1–5 stars

    @Column(columnDefinition = "TEXT")
    private String comment;               // e.g. "Projector was broken, AC was great"

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
