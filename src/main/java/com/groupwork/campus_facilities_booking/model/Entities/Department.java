package com.groupwork.campus_facilities_booking.model.Entities;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a UG department or administrative unit.
 * e.g. "Computer Engineering" under "College of Engineering Sciences"
 */
@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;                    // e.g. "Computer Engineering"

    @Column(nullable = false, length = 150)
    private String college;                 // e.g. "College of Engineering Sciences"

    @Column(length = 200)
    private String hodName;                 // Head of Department name

    @Column(length = 100)
    private String hodEmail;

    // ── Relationships ────────────────────────────────────────
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private List<User> users = new ArrayList<>();

    @OneToMany(mappedBy = "owningDepartment", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private List<Facility> facilities = new ArrayList<>();
}
