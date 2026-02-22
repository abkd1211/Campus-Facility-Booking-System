package com.groupwork.campus_facilities_booking.model.Entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Categorises facilities into meaningful types at UG Legon.
 * e.g. Lecture Hall, Computer Lab, Sports Pitch, Hall Room, Auditorium, etc.
 */
@Entity
@Table(name = "facility_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name; // e.g. "Computer Laboratory"

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Whether bookings for this type require admin approval.
     * e.g. Great Hall bookings always need approval; a seminar room does not.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean requiresApproval = false;

    // ── Relationships ────────────────────────────────────────
    @OneToMany(mappedBy = "facilityType", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private List<Facility> facilities = new ArrayList<>();
}
