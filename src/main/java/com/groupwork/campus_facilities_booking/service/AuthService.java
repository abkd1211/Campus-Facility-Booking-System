package com.groupwork.campus_facilities_booking.service;

import com.groupwork.campus_facilities_booking.model.Entities.Department;
import com.groupwork.campus_facilities_booking.model.Entities.User;
import com.groupwork.campus_facilities_booking.model.Enums.UserRole;
import com.groupwork.campus_facilities_booking.repository.DepartmentRepository;
import com.groupwork.campus_facilities_booking.repository.UserRepository;
import com.groupwork.campus_facilities_booking.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository        userRepository;
    private final DepartmentRepository  departmentRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtService            jwtService;
    private final AuthenticationManager authenticationManager;

    // ── Register new user ─────────────────────────────────────
    @Transactional
    public Map<String, Object> register(User request) {
        // Check email is not already taken
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email '" + request.getEmail() + "' is already registered.");
        }

        // Check student/staff ID uniqueness
        if (request.getStudentId() != null &&
            userRepository.existsByStudentId(request.getStudentId())) {
            throw new RuntimeException("Student ID '" + request.getStudentId() + "' is already registered.");
        }

        User user = User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPasswordHash()))
            .role(request.getRole() != null ? request.getRole() : UserRole.STUDENT)
            .studentId(request.getStudentId())
            .staffId(request.getStaffId())
            .phone(request.getPhone())
            .isActive(true)
            .build();

        // Attach department if provided
        if (request.getDepartment() != null && request.getDepartment().getId() != null) {
            Department dept = departmentRepository.findById(request.getDepartment().getId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
            user.setDepartment(dept);
        }

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);

        return Map.of(
            "token", token,
            "user",  saved
        );
    }

    // ── Login ─────────────────────────────────────────────────
    public Map<String, Object> login(String email, String password) {
        // Throws AuthenticationException if credentials are wrong
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, password)
        );

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found."));

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated. Contact admin.");
        }

        String token = jwtService.generateToken(user);

        return Map.of(
            "token", token,
            "user",  user
        );
    }

    // ── Get currently authenticated user ─────────────────────
    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }

    // ── Change password ───────────────────────────────────────
    @Transactional
    public void changePassword(String currentPassword, String newPassword) {
        User user = getCurrentUser();

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect.");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
