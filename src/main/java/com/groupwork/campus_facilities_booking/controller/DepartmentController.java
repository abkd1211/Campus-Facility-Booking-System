package com.groupwork.campus_facilities_booking.controller;

import com.groupwork.campus_facilities_booking.model.Entities.Department;
import com.groupwork.campus_facilities_booking.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Department operations.
 *
 * GET    /departments              → all departments (public — used in registration dropdown)
 * GET    /departments/{id}         → single department
 * GET    /departments/college/{name} → departments within a college
 * POST   /departments              → create department  [ADMIN]
 * PUT    /departments/{id}         → update department  [ADMIN]
 * DELETE /departments/{id}         → delete department  [ADMIN]
 */
@RestController
@RequestMapping("/departments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DepartmentController {

    private final DepartmentService departmentService;

    // ── GET /departments ─────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    // ── GET /departments/{id} ────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Department> getDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentById(id));
    }

    // ── GET /departments/college/{collegeName} ───────────────
    @GetMapping("/college/{collegeName}")
    public ResponseEntity<List<Department>> getDepartmentsByCollege(
            @PathVariable String collegeName) {
        return ResponseEntity.ok(departmentService.getDepartmentsByCollege(collegeName));
    }

    // ── POST /departments  [ADMIN] ───────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Department> createDepartment(
            @Valid @RequestBody Department department) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(departmentService.createDepartment(department));
    }

    // ── PUT /departments/{id}  [ADMIN] ───────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Department> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody Department department) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, department));
    }

    // ── DELETE /departments/{id}  [ADMIN] ────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }
}
