package com.groupwork.campus_facilities_booking.controller;

import com.groupwork.campus_facilities_booking.model.Entities.MaintenanceSchedule;
import com.groupwork.campus_facilities_booking.service.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Maintenance Schedule operations.
 * All endpoints restricted to ADMIN only.
 *
 * GET    /maintenance                       → all maintenance windows
 * GET    /maintenance/{id}                  → single schedule
 * GET    /maintenance/facility/{facilityId} → maintenance for a facility
 * GET    /maintenance/active                → currently active blocks
 * POST   /maintenance                       → create a maintenance window
 * PUT    /maintenance/{id}                  → update
 * DELETE /maintenance/{id}                  → remove
 */
@RestController
@RequestMapping("/maintenance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    // ── GET /maintenance ─────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<MaintenanceSchedule>> getAllSchedules() {
        return ResponseEntity.ok(maintenanceService.getAllSchedules());
    }

    // ── GET /maintenance/{id} ────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceSchedule> getScheduleById(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.getScheduleById(id));
    }

    // ── GET /maintenance/facility/{facilityId} ───────────────
    @GetMapping("/facility/{facilityId}")
    public ResponseEntity<List<MaintenanceSchedule>> getSchedulesByFacility(
            @PathVariable Long facilityId) {
        return ResponseEntity.ok(maintenanceService.getSchedulesByFacility(facilityId));
    }

    // ── GET /maintenance/active ──────────────────────────────
    // Returns schedules where today falls between startDate and endDate
    @GetMapping("/active")
    public ResponseEntity<List<MaintenanceSchedule>> getActiveSchedules() {
        return ResponseEntity.ok(maintenanceService.getActiveSchedules());
    }

    // ── POST /maintenance ────────────────────────────────────
    // Body: { facilityId, startDate, endDate, reason }
    @PostMapping
    public ResponseEntity<MaintenanceSchedule> createSchedule(
            @Valid @RequestBody MaintenanceSchedule schedule) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(maintenanceService.createSchedule(schedule));
    }

    // ── PUT /maintenance/{id} ────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<MaintenanceSchedule> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceSchedule schedule) {
        return ResponseEntity.ok(maintenanceService.updateSchedule(id, schedule));
    }

    // ── DELETE /maintenance/{id} ─────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        maintenanceService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }
}
