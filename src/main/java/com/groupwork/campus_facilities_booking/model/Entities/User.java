package com.groupwork.campus_facilities_booking.model.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import com.groupwork.campus_facilities_booking.model.Enums.UserRole;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * A person who can interact with the booking system.
 * Implements UserDetails so Spring Security can use it directly.
 *
 * Extra fields beyond the spec:
 *  - studentId / staffId  : UG-issued ID numbers
 *  - phone                : for booking confirmation SMS (future)
 *  - profilePicUrl        : avatar
 *  - isActive             : soft-disable accounts without deleting
 *  - createdAt            : audit trail
 */
@Entity
@Table(
    name = "users",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "email"),
        @UniqueConstraint(columnNames = "student_id"),
        @UniqueConstraint(columnNames = "staff_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Required fields (spec) ───────────────────────────────
    @NotBlank
    @Column(nullable = false, length = 150)
    private String name;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true, length = 150)
    private String email;                   // e.g. kofi.mensah@st.ug.edu.gh

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.STUDENT;

    // ── Auth ─────────────────────────────────────────────────
    @NotBlank
    @Column(nullable = false)
    private String passwordHash;            // BCrypt hash, never plain text

    // ── UG-specific identification ────────────────────────────
    @Column(name = "student_id", unique = true, length = 20)
    private String studentId;              // e.g. "10834201" (8-digit UG student ID)

    @Column(name = "staff_id", unique = true, length = 20)
    private String staffId;               // e.g. "ST-00412" for academic/admin staff

    // ── Contact ──────────────────────────────────────────────
    @Size(max = 20)
    @Column(length = 20)
    private String phone;                  // e.g. "0244123456"

    @Column(length = 300)
    private String profilePicUrl;

    // ── Account state ─────────────────────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Relationships ─────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    @JsonIgnore
    private Department department;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<Booking> bookings = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<WaitlistEntry> waitlistEntries = new ArrayList<>();

    // ── Spring Security (UserDetails) ────────────────────────
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public String getPassword()   { return passwordHash; }
    @Override public String getUsername()   { return email; }
    @Override public boolean isAccountNonExpired()    { return true; }
    @Override public boolean isAccountNonLocked()     { return true; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled()    { return Boolean.TRUE.equals(isActive); }
}
