package com.groupwork.campus_facilities_booking.controller;

import com.groupwork.campus_facilities_booking.model.Entities.User;
import com.groupwork.campus_facilities_booking.model.Enums.UserRole;
import com.groupwork.campus_facilities_booking.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for User management.
 *
 * GET    /users                    → all users              [ADMIN]
 * GET    /users/{id}               → single user            [ADMIN]
 * GET    /users/me                 → current logged-in user
 * GET    /users/role/{role}        → users by role          [ADMIN]
 * GET    /users/department/{id}    → users in a department  [ADMIN]
 * PUT    /users/{id}               → update user profile
 * PATCH  /users/{id}/role          → change role            [ADMIN]
 * PATCH  /users/{id}/deactivate    → deactivate account     [ADMIN]
 * PATCH  /users/{id}/activate      → reactivate account     [ADMIN]
 * DELETE /users/{id}               → delete user            [ADMIN]
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    // ── GET /users  [ADMIN] ──────────────────────────────────
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // ── GET /users/{id}  [ADMIN] ─────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // ── GET /users/me  (own profile) ─────────────────────────
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    // ── GET /users/role/{role}  [ADMIN] ──────────────────────
    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable UserRole role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    // ── GET /users/department/{deptId}  [ADMIN] ──────────────
    @GetMapping("/department/{deptId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getUsersByDepartment(@PathVariable Long deptId) {
        return ResponseEntity.ok(userService.getUsersByDepartment(deptId));
    }

    // ── PUT /users/{id}  (update own profile or ADMIN updates any) ─
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    // ── PATCH /users/{id}/role  [ADMIN] ──────────────────────
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> changeRole(
            @PathVariable Long id,
            @RequestParam UserRole role) {
        return ResponseEntity.ok(userService.changeRole(id, role));
    }

    // ── PATCH /users/{id}/deactivate  [ADMIN] ────────────────
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> deactivateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.setActiveStatus(id, false));
    }

    // ── PATCH /users/{id}/activate  [ADMIN] ──────────────────
    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> activateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.setActiveStatus(id, true));
    }

    // ── DELETE /users/{id}  [ADMIN] ──────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
