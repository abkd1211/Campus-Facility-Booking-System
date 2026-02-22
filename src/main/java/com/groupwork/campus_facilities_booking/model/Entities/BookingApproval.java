package com.groupwork.campus_facilities_booking.model.Entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import com.groupwork.campus_facilities_booking.model.Enums.ApprovalDecision;

/**
 * Records every admin decision on a booking.
 *
 * When a booking for a large venue (e.g. Great Hall, Main Pitch) is submitted,
 * it starts as PENDING. An ADMIN can APPROVE or REJECT it here, with remarks.
 *
 * This gives us a full audit trail — who decided what and when.
 */
@Entity
@Table(name = "booking_approvals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    /** The ADMIN or STAFF who made the decision. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApprovalDecision decision;     // APPROVED | REJECTED

    @Column(columnDefinition = "TEXT")
    private String remarks;                // e.g. "Clash with convocation rehearsal"

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime decidedAt = LocalDateTime.now();
}
