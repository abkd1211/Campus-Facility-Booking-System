package com.groupwork.campus_facilities_booking.controller;

import com.groupwork.campus_facilities_booking.model.Entities.FacilityType;
import com.groupwork.campus_facilities_booking.service.FacilityTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Facility Types.
 *
 * GET    /facility-types           → all types (public — used in search filters)
 * GET    /facility-types/{id}      → single type
 * POST   /facility-types           → create type  [ADMIN]
 * PUT    /facility-types/{id}      → update type  [ADMIN]
 * DELETE /facility-types/{id}      → delete type  [ADMIN]
 */
@RestController
@RequestMapping("/facility-types")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FacilityTypeController {

    private final FacilityTypeService facilityTypeService;

    // ── GET /facility-types ──────────────────────────────────
    @GetMapping
    public ResponseEntity<List<FacilityType>> getAllTypes() {
        return ResponseEntity.ok(facilityTypeService.getAllTypes());
    }

    // ── GET /facility-types/{id} ─────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<FacilityType> getTypeById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityTypeService.getTypeById(id));
    }

    // ── POST /facility-types  [ADMIN] ────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityType> createType(
            @Valid @RequestBody FacilityType facilityType) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(facilityTypeService.createType(facilityType));
    }

    // ── PUT /facility-types/{id}  [ADMIN] ────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityType> updateType(
            @PathVariable Long id,
            @Valid @RequestBody FacilityType facilityType) {
        return ResponseEntity.ok(facilityTypeService.updateType(id, facilityType));
    }

    // ── DELETE /facility-types/{id}  [ADMIN] ─────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteType(@PathVariable Long id) {
        facilityTypeService.deleteType(id);
        return ResponseEntity.noContent().build();
    }
}
