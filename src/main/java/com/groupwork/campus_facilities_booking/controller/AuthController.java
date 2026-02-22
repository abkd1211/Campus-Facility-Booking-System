package com.groupwork.campus_facilities_booking.controller;

import com.groupwork.campus_facilities_booking.model.Entities.User;
import com.groupwork.campus_facilities_booking.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Authentication endpoints — no auth token required to hit these.
 *
 * POST /auth/register   → create a new account (student/staff)
 * POST /auth/login      → returns a JWT token on success
 * POST /auth/logout     → invalidates current token (client-side)
 * GET  /auth/me         → returns current user from token
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    // ── POST /auth/register ──────────────────────────────────
    // Body: { name, email, password, role, studentId, phone, departmentId }
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(user));
    }

    // ── POST /auth/login ─────────────────────────────────────
    // Body: { email, password }
    // Returns: { token, user }
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String email    = credentials.get("email");
        String password = credentials.get("password");
        return ResponseEntity.ok(authService.login(email, password));
    }

    // ── POST /auth/logout ────────────────────────────────────
    // JWT is stateless — just tell the client to discard the token.
    // We return 200 so the frontend knows to clear storage.
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    // ── GET /auth/me ─────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<User> getMe() {
        return ResponseEntity.ok(authService.getCurrentUser());
    }

    // ── POST /auth/change-password ───────────────────────────
    // Body: { currentPassword, newPassword }
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestBody Map<String, String> body) {
        authService.changePassword(body.get("currentPassword"), body.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
