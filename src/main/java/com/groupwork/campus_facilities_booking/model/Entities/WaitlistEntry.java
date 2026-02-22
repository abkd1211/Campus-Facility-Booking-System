package com.groupwork.campus_facilities_booking.model.Entities;

import jakarta.persistence.*;
import lombok.*;
import com.groupwork.campus_facilities_booking.model.Enums.WaitlistStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * When a desired time slot for a facility is already booked,
 * a user can join the waitlist for that slot.
 *
 * If the existing booking is cancelled, the system promotes the
 * first WAITING entry automatically (business logic in service layer).
 *
 * position  : queue order (1 = first in line)
 * status    : WAITING | PROMOTED | EXPIRED
 */
@Entity
@Table(
    name = "waitlist",
    uniqueConstraints = {
        // A user can only appear once per facility/date/slot combination
        @UniqueConstraint(columnNames = {"facility_id", "user_id", "date", "start_time"})
    },
    indexes = {
        @Index(name = "idx_waitlist_facility_date", columnList = "facility_id, date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaitlistEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(length = 300)
    private String purpose;

    @Column(nullable = false)
    private Integer position;              // 1 = top of queue

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private WaitlistStatus status = WaitlistStatus.WAITING;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();
}
