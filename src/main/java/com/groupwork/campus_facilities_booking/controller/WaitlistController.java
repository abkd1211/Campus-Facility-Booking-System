package com.groupwork.campus_facilities_booking.controller;

import com.groupwork.campus_facilities_booking.model.Entities.WaitlistEntry;
import com.groupwork.campus_facilities_booking.service.WaitlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Waitlist operations.
 *
 * GET    /waitlist                          → all waitlist entries       [ADMIN]
 * GET    /waitlist/my                       → current user's waitlist
 * GET    /waitlist/facility/{facilityId}    → waitlist for a facility    [ADMIN]
 * POST   /waitlist                          → join the waitlist
 * DELETE /waitlist/{id}                     → leave the waitlist
 */
@RestController
@RequestMapping("/waitlist")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WaitlistController {

    private final WaitlistService waitlistService;

    // ── GET /waitlist  [ADMIN] ───────────────────────────────
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WaitlistEntry>> getAllWaitlistEntries() {
        return ResponseEntity.ok(waitlistService.getAllEntries());
    }

    // ── GET /waitlist/my ─────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<List<WaitlistEntry>> getMyWaitlistEntries() {
        return ResponseEntity.ok(waitlistService.getEntriesForCurrentUser());
    }

    // ── GET /waitlist/facility/{facilityId}  [ADMIN] ─────────
    @GetMapping("/facility/{facilityId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WaitlistEntry>> getWaitlistByFacility(
            @PathVariable Long facilityId) {
        return ResponseEntity.ok(waitlistService.getEntriesByFacility(facilityId));
    }

    // ── POST /waitlist ───────────────────────────────────────
    // Body: { facilityId, date, startTime, endTime, purpose }
    @PostMapping
    public ResponseEntity<WaitlistEntry> joinWaitlist(
            @Valid @RequestBody WaitlistEntry entry) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(waitlistService.joinWaitlist(entry));
    }

    // ── DELETE /waitlist/{id}  (leave the queue) ─────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> leaveWaitlist(@PathVariable Long id) {
        waitlistService.leaveWaitlist(id);
        return ResponseEntity.noContent().build();
    }
}
