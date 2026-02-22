package com.groupwork.campus_facilities_booking.controller;

import com.groupwork.campus_facilities_booking.model.Entities.Booking;
import com.groupwork.campus_facilities_booking.model.Enums.BookingStatus;
import com.groupwork.campus_facilities_booking.service.BookingService;
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
 * REST Controller for Booking operations.
 *
 * GET    /bookings                            → all bookings         [ADMIN]
 * GET    /bookings/{id}                       → single booking
 * GET    /bookings/my                         → current user's bookings
 * GET    /bookings/facility/{facilityId}      → bookings for a facility
 * GET    /bookings/facility/{id}?date=        → bookings for facility on date
 * GET    /bookings/status/{status}            → filter by status     [ADMIN]
 * GET    /bookings/today                      → today's confirmed bookings
 * GET    /availability?facilityId=&date=      → available 30-min slots (spec)
 * POST   /bookings                            → create a booking
 * PUT    /bookings/{id}                       → update a booking
 * PATCH  /bookings/{id}/cancel               → cancel own booking
 * PATCH  /bookings/{id}/check-in             → check in             [SECURITY/ADMIN]
 * PATCH  /bookings/{id}/check-out            → check out            [SECURITY/ADMIN]
 * DELETE /bookings/{id}                       → hard delete          [ADMIN]
 */
@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    // ── GET /bookings  [ADMIN] ───────────────────────────────
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // ── GET /bookings/{id} ───────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    // ── GET /bookings/my  (logged-in user's own bookings) ────
    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings() {
        return ResponseEntity.ok(bookingService.getBookingsForCurrentUser());
    }

    // ── GET /bookings/facility/{facilityId} ─────────────────
    @GetMapping("/facility/{facilityId}")
    public ResponseEntity<List<Booking>> getBookingsByFacility(
            @PathVariable Long facilityId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(bookingService.getBookingsByFacility(facilityId, date));
    }

    // ── GET /bookings/status/{status}  [ADMIN] ──────────────
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Booking>> getBookingsByStatus(
            @PathVariable BookingStatus status) {
        return ResponseEntity.ok(bookingService.getBookingsByStatus(status));
    }

    // ── GET /bookings/today  [ADMIN + SECURITY] ──────────────
    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY')")
    public ResponseEntity<List<Booking>> getTodaysBookings() {
        return ResponseEntity.ok(bookingService.getTodaysBookings());
    }

    // ── GET /availability?facilityId=1&date=2026-02-17 ──────
    // Spec endpoint — returns 30-min availability slots
    @GetMapping("/availability")
    public ResponseEntity<?> checkAvailability(
            @RequestParam Long facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(bookingService.checkAvailability(facilityId, date));
    }

    // ── POST /bookings ───────────────────────────────────────
    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody Booking booking) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(booking));
    }

    // ── PUT /bookings/{id} ───────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody Booking booking) {
        return ResponseEntity.ok(bookingService.updateBooking(id, booking));
    }

    // ── PATCH /bookings/{id}/cancel ──────────────────────────
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    // ── PATCH /bookings/{id}/check-in  [SECURITY + ADMIN] ───
    @PatchMapping("/{id}/check-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY')")
    public ResponseEntity<Booking> checkIn(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.checkIn(id));
    }

    // ── PATCH /bookings/{id}/check-out  [SECURITY + ADMIN] ──
    @PatchMapping("/{id}/check-out")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY')")
    public ResponseEntity<Booking> checkOut(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.checkOut(id));
    }

    // ── PATCH /bookings/{id}/extend ──────────────────────────
    // Allow user to extend booking by 30 minutes (up to max extensions)
    @PatchMapping("/{id}/extend")
    public ResponseEntity<Booking> extendBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.extendBooking(id));
    }

    // ── DELETE /bookings/{id}  [ADMIN] ───────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }
}
