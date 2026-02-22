package com.groupwork.campus_facilities_booking.model.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A bookable physical space at the University of Ghana, Legon.
 *
 * Covers everything from a 12-seat library study room to the 2,000-seat
 * Great Hall, sports pitches, computer labs, hall common rooms, and more.
 *
 * Extra fields beyond the spec:
 *  - facilityType / owningDepartment : classification & ownership
 *  - amenity flags                   : projector, AC, PA system, whiteboard, etc.
 *  - openingTime / closingTime       : enforce bookable hours
 *  - isOutdoor                       : affects availability in rain, etc.
 *  - imageUrl                        : shown on the frontend card
 *  - isAvailable                     : admin toggle (maintenance, etc.)
 *  - rules                           : free-text booking rules/notes
 */
@Entity
@Table(name = "facilities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Required fields (spec) ──────────────────────────────
    @NotBlank
    @Column(nullable = false, length = 150)
    private String name;                    // e.g. "CPEN Computer Lab 1"

    @NotBlank
    @Column(nullable = false, length = 200)
    private String location;               // e.g. "Engineering Block B, Room 101"

    @Min(1)
    @Column(nullable = false)
    private Integer capacity;              // max number of people

    // ── Classification ──────────────────────────────────────
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "facility_type_id", nullable = false)
    private FacilityType facilityType;     // Lecture Hall | Lab | Pitch | etc.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department owningDepartment;   // null = shared/general university space

    // ── Amenities (bonus marks) ─────────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private Boolean hasProjector = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean hasAirConditioning = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean hasWhiteboard = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean hasPaSystem = false;       // public address / microphone

    @Column(nullable = false)
    @Builder.Default
    private Boolean hasVideoConferencing = false;  // Zoom/Teams screen, etc.

    @Column(nullable = false)
    @Builder.Default
    private Boolean hasWifi = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isOutdoor = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isWheelchairAccessible = false;

    // ── Availability settings ────────────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private LocalTime openingTime = LocalTime.of(7, 0);

    @Column(nullable = false)
    @Builder.Default
    private LocalTime closingTime = LocalTime.of(22, 0);

    /**
     * Admin override — set to false during maintenance or renovation.
     * No new bookings can be made when false.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    // ── Media & info ─────────────────────────────────────────
    @Column(length = 300)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String rules;                  // e.g. "No food or drinks inside the lab"

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Relationships ─────────────────────────────────────────
    @OneToMany(mappedBy = "facility", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<Booking> bookings = new ArrayList<>();

    @OneToMany(mappedBy = "facility", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<WaitlistEntry> waitlistEntries = new ArrayList<>();

    @OneToMany(mappedBy = "facility", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<MaintenanceSchedule> maintenanceSchedules = new ArrayList<>();
}
