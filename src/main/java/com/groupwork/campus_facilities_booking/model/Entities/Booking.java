package com.groupwork.campus_facilities_booking.model.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import com.groupwork.campus_facilities_booking.model.Enums.BookingStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A reservation of a facility for a specific date and time window.
 *
 * Extra fields beyond the spec:
 *  - purpose          : what the booking is for ("CPEN 412 Lab", "SRC Meeting")
 *  - attendees        : expected headcount — validated against facility capacity
 *  - isRecurring      : weekly/daily recurring bookings (e.g. a semester-long lecture)
 *  - recurrenceRule   : "WEEKLY" | "DAILY" for recurring pattern
 *  - checkInTime      : recorded when the user checks in via QR or admin
 *  - checkOutTime     : recorded when session ends
 *  - notes            : any special requests
 *  - createdAt/updatedAt : full audit trail
 */
@Entity
@Table(
    name = "bookings",
    indexes = {
        // Speed up the critical availability-check query
        @Index(name = "idx_bookings_facility_date", columnList = "facility_id, date"),
        @Index(name = "idx_bookings_user",          columnList = "user_id"),
        @Index(name = "idx_bookings_status",        columnList = "status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Required fields (spec) ──────────────────────────────
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull
    @Column(nullable = false)
    private LocalDate date;

    @NotNull
    @Column(nullable = false)
    private LocalTime startTime;

    @NotNull
    @Column(nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    // ── Extra fields (bonus marks) ──────────────────────────
    @NotBlank
    @Column(nullable = false, length = 300)
    private String purpose;                // e.g. "CPEN 412 Web Architecture Lab"

    @Min(1)
    @Column(nullable = false)
    @Builder.Default
    private Integer attendees = 1;         // validated against facility.capacity

    /**
     * True for recurring bookings (e.g. every Monday 8–10 AM for a semester).
     * When true, recurrenceRule is also set.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isRecurring = false;

    @Column(length = 50)
    private String recurrenceRule;         // "WEEKLY" | "DAILY"

    @Column(length = 500)
    private String notes;                  // special requests or setup instructions

    // ── Check-in / Check-out (bonus — links to SecurityOfficer use) ──
    @Column
    private LocalDateTime checkInTime;

    @Column
    private LocalDateTime checkOutTime;

    // ── Extension & Expiry (session-based bookings) ──────────
    /**
     * Maximum number of times this booking can be extended.
     * Default: 2 (allows 90 mins total for 30-min slots)
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer maxExtensions = 2;

    /**
     * Number of times this booking has been extended.
     * Each extension adds 30 minutes.
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer extensionCount = 0;

    /**
     * Original end time before any extensions.
     * Useful for tracking how much the session has been extended.
     */
    @Column
    private LocalDateTime originalEndTime;

    /**
     * Timestamp when the session was automatically marked as expired.
     * If null, the booking has not expired yet.
     */
    @Column
    private LocalDateTime expiredAt;

    /**
     * Reminder sent to user before expiry.
     * Default: 5 minutes before expiration.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean reminderSent = false;

    // ── Audit ────────────────────────────────────────────────
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ── Relationships ─────────────────────────────────────────
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingApproval> approvals = new ArrayList<>();
}
