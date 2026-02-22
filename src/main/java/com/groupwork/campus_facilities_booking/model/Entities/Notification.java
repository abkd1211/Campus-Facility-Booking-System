package com.groupwork.campus_facilities_booking.model.Entities;

import jakarta.persistence.*;
import lombok.*;
import com.groupwork.campus_facilities_booking.model.Enums.NotificationType;

import java.time.LocalDateTime;

/**
 * In-app notification sent to a user when:
 *  - Their booking is confirmed, rejected, or cancelled
 *  - They are promoted from the waitlist
 *  - A booking they made is coming up soon (reminder)
 *  - A facility they use has a maintenance block placed on it
 *
 * isRead tracks whether the user has seen the notification.
 */
@Entity
@Table(
    name = "notifications",
    indexes = {
        @Index(name = "idx_notifications_user", columnList = "user_id, is_read")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String title;                  // e.g. "Booking Confirmed"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;                // full notification text

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private NotificationType type = NotificationType.BOOKING_CONFIRMED;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    /** Optional deep-link reference to the relevant booking. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
