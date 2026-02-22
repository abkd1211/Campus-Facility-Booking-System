package com.groupwork.campus_facilities_booking.controller;

import com.groupwork.campus_facilities_booking.model.Entities.Facility;
import com.groupwork.campus_facilities_booking.service.FacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller for Facility operations.
 *
 * GET    /facilities                          → list all facilities
 * GET    /facilities/{id}                     → get one facility
 * GET    /facilities/search?name=&type=       → search/filter facilities
 * GET    /facilities/type/{typeId}            → all facilities of a type
 * GET    /facilities/department/{deptId}      → all facilities owned by a dept
 * GET    /facilities/{id}/availability        → check 30-min slots for a date
 * POST   /facilities                          → create facility  [ADMIN only]
 * PUT    /facilities/{id}                     → update facility  [ADMIN only]
 * PATCH  /facilities/{id}/toggle-availability → enable/disable  [ADMIN only]
 * DELETE /facilities/{id}                     → delete facility  [ADMIN only]
 */
@RestController
@RequestMapping("/facilities")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FacilityController {

    private final FacilityService facilityService;

    // ── GET /facilities ──────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Facility>> getAllFacilities() {
        return ResponseEntity.ok(facilityService.getAllFacilities());
    }

    // ── GET /facilities/{id} ─────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Facility> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }

    // ── GET /facilities/search?name=lab&type=2&hasProjector=true ─
    @GetMapping("/search")
    public ResponseEntity<List<Facility>> searchFacilities(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long typeId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Boolean hasProjector,
            @RequestParam(required = false) Boolean hasAirConditioning,
            @RequestParam(required = false) Boolean hasWifi,
            @RequestParam(required = false) Boolean isOutdoor,
            @RequestParam(required = false) Integer minCapacity) {
        return ResponseEntity.ok(
            facilityService.searchFacilities(name, typeId, departmentId,
                hasProjector, hasAirConditioning, hasWifi, isOutdoor, minCapacity)
        );
    }

    // ── GET /facilities/type/{typeId} ────────────────────────
    @GetMapping("/type/{typeId}")
    public ResponseEntity<List<Facility>> getFacilitiesByType(@PathVariable Long typeId) {
        return ResponseEntity.ok(facilityService.getFacilitiesByType(typeId));
    }

    // ── GET /facilities/department/{deptId} ─────────────────
    @GetMapping("/department/{deptId}")
    public ResponseEntity<List<Facility>> getFacilitiesByDepartment(@PathVariable Long deptId) {
        return ResponseEntity.ok(facilityService.getFacilitiesByDepartment(deptId));
    }

    // ── GET /facilities/{id}/availability?date=2026-02-17 ───
    // Returns list of 30-minute slots and whether each is free or booked
    @GetMapping("/{id}/availability")
    public ResponseEntity<?> getAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(facilityService.getAvailabilitySlots(id, date));
    }

    // ── POST /facilities  [ADMIN only] ───────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Facility> createFacility(@Valid @RequestBody Facility facility) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(facilityService.createFacility(facility));
    }

    // ── PUT /facilities/{id}  [ADMIN only] ───────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Facility> updateFacility(
            @PathVariable Long id,
            @Valid @RequestBody Facility facility) {
        return ResponseEntity.ok(facilityService.updateFacility(id, facility));
    }

    // ── PATCH /facilities/{id}/toggle-availability  [ADMIN] ─
    @PatchMapping("/{id}/toggle-availability")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Facility> toggleAvailability(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.toggleAvailability(id));
    }

    // ── DELETE /facilities/{id}  [ADMIN only] ────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.noContent().build();
    }
}
