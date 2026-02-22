package com.groupwork.campus_facilities_booking.model.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Blocks a facility from being booked during a scheduled maintenance,
 * renovation, or special event reservation period.
 *
 * e.g. "Engineering Block B labs — closed for Semester 2 exam period"
 *      "UG Main Pitch — resurfacing 1–7 March 2026"
 *
 * The availability check in BookingService must reject any booking
 * whose date falls within an active MaintenanceSchedule window.
 */
@Entity
@Table(
    name = "maintenance_schedules",
    indexes = {
        @Index(name = "idx_maintenance_facility", columnList = "facility_id, start_date, end_date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    @NotNull
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull
    @Column(nullable = false)
    private LocalDate endDate;

    @NotBlank
    @Column(nullable = false, length = 300)
    private String reason;                 // e.g. "Annual electrical maintenance"

    /** Set by the admin who scheduled the maintenance. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
