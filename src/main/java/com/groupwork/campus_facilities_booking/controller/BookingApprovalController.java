package com.groupwork.campus_facilities_booking.controller;

import com.groupwork.campus_facilities_booking.model.Entities.BookingApproval;
import com.groupwork.campus_facilities_booking.service.BookingApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for the Admin approval workflow.
 *
 * Large-venue bookings (Great Hall, Main Pitch, Auditorium) start as PENDING
 * and must be explicitly approved or rejected by an ADMIN.
 *
 * GET    /approvals                        → all decisions           [ADMIN]
 * GET    /approvals/pending                → pending bookings queue  [ADMIN]
 * GET    /approvals/booking/{bookingId}    → approval history for a booking
 * POST   /approvals/{bookingId}/approve    → approve a booking       [ADMIN]
 * POST   /approvals/{bookingId}/reject     → reject a booking        [ADMIN]
 */
@RestController
@RequestMapping("/approvals")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")       // All endpoints here are ADMIN only
public class BookingApprovalController {

    private final BookingApprovalService approvalService;

    // ── GET /approvals ───────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<BookingApproval>> getAllApprovals() {
        return ResponseEntity.ok(approvalService.getAllApprovals());
    }

    // ── GET /approvals/pending ───────────────────────────────
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingBookings() {
        return ResponseEntity.ok(approvalService.getPendingBookings());
    }

    // ── GET /approvals/booking/{bookingId} ───────────────────
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<BookingApproval>> getApprovalHistory(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(approvalService.getApprovalHistory(bookingId));
    }

    // ── POST /approvals/{bookingId}/approve ──────────────────
    // Body: { "remarks": "Looks good, approved!" }  (optional)
    @PostMapping("/{bookingId}/approve")
    public ResponseEntity<BookingApproval> approveBooking(
            @PathVariable Long bookingId,
            @RequestBody(required = false) Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(approvalService.approveBooking(bookingId, remarks));
    }

    // ── POST /approvals/{bookingId}/reject ───────────────────
    // Body: { "remarks": "Clashes with convocation rehearsal" }
    @PostMapping("/{bookingId}/reject")
    public ResponseEntity<BookingApproval> rejectBooking(
            @PathVariable Long bookingId,
            @RequestBody(required = false) Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(approvalService.rejectBooking(bookingId, remarks));
    }
}
