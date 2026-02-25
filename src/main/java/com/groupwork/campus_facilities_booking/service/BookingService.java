package com.groupwork.campus_facilities_booking.service;

import com.groupwork.campus_facilities_booking.model.Entities.Booking;
import com.groupwork.campus_facilities_booking.model.Entities.Facility;
import com.groupwork.campus_facilities_booking.model.Entities.User;
import com.groupwork.campus_facilities_booking.model.Entities.WaitlistEntry;
import com.groupwork.campus_facilities_booking.model.Enums.BookingStatus;
import com.groupwork.campus_facilities_booking.model.Enums.NotificationType;
import com.groupwork.campus_facilities_booking.model.Enums.WaitlistStatus;
import com.groupwork.campus_facilities_booking.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;
    private final WaitlistRepository waitlistRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    // ── Get all bookings (Admin only) ────────────────────────
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // ── Get single booking ───────────────────────────────────
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }

    // ── Get current user's bookings ──────────────────────────
    public List<Booking> getBookingsForCurrentUser() {
        User currentUser = getCurrentUser();
        return bookingRepository.findByUserOrderByDateDescStartTimeDesc(currentUser);
    }

    // ── Get bookings by facility, optionally filtered by date ─
    public List<Booking> getBookingsByFacility(Long facilityId, LocalDate date) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new RuntimeException("Facility not found with id: " + facilityId));
        if (date != null) {
            return bookingRepository.findByFacilityAndDate(facility, date);
        }
        return bookingRepository.findByFacility(facility);
    }

    // ── Get bookings by status ───────────────────────────────
    public List<Booking> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    // ── Get today's confirmed bookings ───────────────────────
    public List<Booking> getTodaysBookings() {
        return bookingRepository.findByDateAndStatus(LocalDate.now(), BookingStatus.CONFIRMED);
    }

    // ── Check availability — returns 30-min slot map ─────────
    public Map<String, Object> checkAvailability(Long facilityId, LocalDate date) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new RuntimeException("Facility not found with id: " + facilityId));

        // Get all confirmed bookings for this facility on this date
        List<Booking> existingBookings = bookingRepository
                .findByFacilityAndDateAndStatusIn(facility, date,
                        List.of(BookingStatus.CONFIRMED));

        // Build 30-minute slots between opening and closing time
        List<Map<String, Object>> slots = new ArrayList<>();
        LocalTime cursor = facility.getOpeningTime();

        while (cursor.plusMinutes(30).compareTo(facility.getClosingTime()) <= 0) {
            LocalTime slotStart = cursor;
            LocalTime slotEnd = cursor.plusMinutes(30);

            boolean isBooked = existingBookings.stream()
                    .anyMatch(b -> b.getStartTime().isBefore(slotEnd) && b.getEndTime().isAfter(slotStart));

            Map<String, Object> slot = new LinkedHashMap<>();
            slot.put("startTime", slotStart.toString());
            slot.put("endTime", slotEnd.toString());
            slot.put("available", !isBooked);

            slots.add(slot);
            cursor = slotEnd;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("facilityId", facilityId);
        result.put("facilityName", facility.getName());
        result.put("date", date.toString());
        result.put("slots", slots);
        return result;
    }

    // ── Get availability slots for FacilityController ────────
    public Map<String, Object> getAvailabilitySlots(Long facilityId, LocalDate date) {
        return checkAvailability(facilityId, date);
    }

    // ── Create booking ───────────────────────────────────────
    @Transactional
    public Booking createBooking(Booking booking) {
        Facility facility = facilityRepository.findById(booking.getFacility().getId())
                .orElseThrow(() -> new RuntimeException("Facility not found"));
        User user = getCurrentUser();

        // 1. Check facility is available (not toggled off)
        if (!facility.getIsAvailable()) {
            throw new RuntimeException("Facility '" + facility.getName() + "' is currently unavailable.");
        }

        // 2. Check booking is within opening hours
        if (booking.getStartTime().isBefore(facility.getOpeningTime()) ||
                booking.getEndTime().isAfter(facility.getClosingTime())) {
            throw new RuntimeException(
                    "Booking must be within operating hours: "
                            + facility.getOpeningTime() + " – " + facility.getClosingTime());
        }

        // 3. Check end time is after start time and at least 30 mins
        if (!booking.getEndTime().isAfter(booking.getStartTime())) {
            throw new RuntimeException("End time must be after start time.");
        }
        long minutes = java.time.Duration.between(booking.getStartTime(), booking.getEndTime()).toMinutes();
        if (minutes < 30) {
            throw new RuntimeException("Minimum booking duration is 30 minutes.");
        }

        // 4. Check attendee count against capacity
        if (booking.getAttendees() > facility.getCapacity()) {
            throw new RuntimeException(
                    "Attendees (" + booking.getAttendees() + ") exceeds facility capacity (" + facility.getCapacity()
                            + ").");
        }

        // 5. Check for maintenance blocks on this date
        boolean underMaintenance = maintenanceRepository
                .findByFacilityAndDateRange(facility, booking.getDate())
                .stream().findAny().isPresent();
        if (underMaintenance) {
            throw new RuntimeException(
                    "Facility '" + facility.getName() + "' is under maintenance on " + booking.getDate());
        }

        // 6. Check for booking conflicts
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                facility, booking.getDate(),
                booking.getStartTime(), booking.getEndTime(),
                List.of(BookingStatus.CONFIRMED));
        if (!conflicts.isEmpty()) {
            throw new RuntimeException(
                    "Time slot " + booking.getStartTime() + " – " + booking.getEndTime()
                            + " on " + booking.getDate() + " is already booked.");
        }

        // 7. All bookings are immediately confirmed — no approval step required.
        booking.setFacility(facility);
        booking.setUser(user);
        booking.setStatus(BookingStatus.CONFIRMED);

        Booking saved = bookingRepository.save(booking);

        // 8. Notify user
        notificationService.sendNotification(
                user, saved,
                "Booking Confirmed",
                "Your booking for " + facility.getName() + " on " + booking.getDate() + " is confirmed!",
                NotificationType.BOOKING_CONFIRMED);

        return saved;
    }

    // ── Update booking ───────────────────────────────────────
    @Transactional
    public Booking updateBooking(Long id, Booking updated) {
        Booking existing = getBookingById(id);

        // Only PENDING or CONFIRMED bookings can be updated
        if (existing.getStatus() == BookingStatus.CANCELLED ||
                existing.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot update a " + existing.getStatus() + " booking.");
        }

        existing.setDate(updated.getDate());
        existing.setStartTime(updated.getStartTime());
        existing.setEndTime(updated.getEndTime());
        existing.setPurpose(updated.getPurpose());
        existing.setAttendees(updated.getAttendees());
        existing.setNotes(updated.getNotes());
        existing.setIsRecurring(updated.getIsRecurring());
        existing.setRecurrenceRule(updated.getRecurrenceRule());

        return bookingRepository.save(existing);
    }

    // ── Cancel booking ───────────────────────────────────────
    @Transactional
    public Booking cancelBooking(Long id) {
        Booking booking = getBookingById(id);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled.");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed booking.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        // Notify the user
        notificationService.sendNotification(
                booking.getUser(), saved,
                "Booking Cancelled",
                "Your booking for " + booking.getFacility().getName()
                        + " on " + booking.getDate() + " has been cancelled.",
                NotificationType.BOOKING_CANCELLED);

        // Auto-promote first person on the waitlist for this slot
        promoteWaitlistIfAny(booking);

        return saved;
    }

    // ── Check in ─────────────────────────────────────────────
    @Transactional
    public Booking checkIn(Long id) {
        Booking booking = getBookingById(id);
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Only CONFIRMED bookings can be checked in.");
        }
        booking.setCheckInTime(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    // ── Check out ─────────────────────────────────────────────
    @Transactional
    public Booking checkOut(Long id) {
        Booking booking = getBookingById(id);
        if (booking.getCheckInTime() == null) {
            throw new RuntimeException("Cannot check out — no check-in recorded.");
        }
        booking.setCheckOutTime(LocalDateTime.now());
        booking.setStatus(BookingStatus.COMPLETED);
        return bookingRepository.save(booking);
    }

    // ── Hard delete (Admin) ───────────────────────────────────
    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = getBookingById(id);

        // Nullify booking FK on any linked notifications first
        // (Notification keeps the row for audit — we just clear the FK reference)
        notificationRepository.findByBooking(booking)
                .forEach(n -> {
                    n.setBooking(null);
                    notificationRepository.save(n);
                });

        bookingRepository.delete(booking);
    }

    // ── Waitlist auto-promotion (internal) ───────────────────
    private void promoteWaitlistIfAny(Booking cancelledBooking) {
        List<WaitlistEntry> queue = waitlistRepository
                .findByFacilityAndDateAndStartTimeAndStatusOrderByPositionAsc(
                        cancelledBooking.getFacility(),
                        cancelledBooking.getDate(),
                        cancelledBooking.getStartTime(),
                        WaitlistStatus.WAITING);

        if (!queue.isEmpty()) {
            WaitlistEntry first = queue.get(0);
            first.setStatus(WaitlistStatus.PROMOTED);
            waitlistRepository.save(first);

            // Create a new confirmed booking for the promoted user
            Booking promoted = Booking.builder()
                    .facility(cancelledBooking.getFacility())
                    .user(first.getUser())
                    .date(first.getDate())
                    .startTime(first.getStartTime())
                    .endTime(first.getEndTime())
                    .purpose(first.getPurpose() != null ? first.getPurpose() : "Promoted from waitlist")
                    .attendees(1)
                    .status(BookingStatus.CONFIRMED)
                    .build();
            bookingRepository.save(promoted);

            // Notify promoted user
            notificationService.sendNotification(
                    first.getUser(), promoted,
                    "Waitlist Promotion!",
                    "Great news! A slot opened up for "
                            + cancelledBooking.getFacility().getName()
                            + " on " + cancelledBooking.getDate()
                            + ". Your booking is now confirmed.",
                    NotificationType.WAITLIST_PROMOTED);

            // Shift remaining queue positions down
            for (int i = 1; i < queue.size(); i++) {
                WaitlistEntry entry = queue.get(i);
                entry.setPosition(entry.getPosition() - 1);
                waitlistRepository.save(entry);
            }
        }
    }

    // ── Extend booking session (add 30 more minutes) ──────────
    @Transactional
    public Booking extendBooking(Long id) {
        Booking booking = getBookingById(id);

        // Only CONFIRMED or ACTIVE bookings can be extended
        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.ACTIVE) {
            throw new RuntimeException(
                    "Only confirmed or active bookings can be extended. Current status: " + booking.getStatus());
        }

        // Check if max extensions reached
        if (booking.getExtensionCount() >= booking.getMaxExtensions()) {
            throw new RuntimeException(
                    "Maximum extensions (" + booking.getMaxExtensions() + ") reached for this booking.");
        }

        // Store original end time on first extension
        if (booking.getOriginalEndTime() == null) {
            booking.setOriginalEndTime(
                    LocalDateTime.of(booking.getDate(), booking.getEndTime()));
        }

        // Add 30 minutes
        booking.setEndTime(booking.getEndTime().plusMinutes(30));
        booking.setExtensionCount(booking.getExtensionCount() + 1);
        booking.setReminderSent(false); // Reset reminder for new window

        Booking saved = bookingRepository.save(booking);

        // Notify user
        notificationService.sendNotification(
                booking.getUser(), saved,
                "Booking Extended",
                "Your booking for " + booking.getFacility().getName()
                        + " has been extended by 30 minutes. New end time: " + saved.getEndTime()
                        + ". Extensions used: " + saved.getExtensionCount() + "/" + saved.getMaxExtensions(),
                NotificationType.BOOKING_CONFIRMED);

        return saved;
    }

    // ── Auto-expire bookings (scheduled task) ────────────────
    @Transactional
    public void autoExpireBookings() {
        LocalDateTime now = LocalDateTime.now();

        // Find all active/confirmed bookings that have passed their end time
        List<Booking> expiredBookings = bookingRepository.findByStatusIn(
                List.of(BookingStatus.CONFIRMED, BookingStatus.ACTIVE)).stream()
                .filter(b -> LocalDateTime.of(b.getDate(), b.getEndTime()).isBefore(now))
                .filter(b -> b.getExpiredAt() == null) // Not already marked as expired
                .toList();

        for (Booking booking : expiredBookings) {
            booking.setStatus(BookingStatus.EXPIRED);
            booking.setExpiredAt(now);
            bookingRepository.save(booking);

            // Notify user
            notificationService.sendNotification(
                    booking.getUser(), booking,
                    "Booking Expired",
                    "Your booking session for " + booking.getFacility().getName()
                            + " has expired. Total extensions used: " + booking.getExtensionCount(),
                    NotificationType.BOOKING_CANCELLED);
        }
    }

    // ── Send expiry reminders (5 minutes before) ─────────────
    @Transactional
    public void sendExpiryReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime inFiveMinutes = now.plusMinutes(5);

        // Find bookings that will expire in ~5 minutes and haven't been reminded
        List<Booking> bookingsToRemind = bookingRepository.findByStatusIn(
                List.of(BookingStatus.CONFIRMED, BookingStatus.ACTIVE)).stream()
                .filter(b -> {
                    LocalDateTime endDateTime = LocalDateTime.of(b.getDate(), b.getEndTime());
                    return endDateTime.isAfter(now) && endDateTime.isBefore(inFiveMinutes);
                })
                .filter(b -> !b.getReminderSent())
                .toList();

        for (Booking booking : bookingsToRemind) {
            booking.setReminderSent(true);
            bookingRepository.save(booking);

            // Send reminder notification
            notificationService.sendNotification(
                    booking.getUser(), booking,
                    "Booking Expiring Soon",
                    "Your booking for " + booking.getFacility().getName()
                            + " expires in 5 minutes. You can extend it if you need more time.",
                    NotificationType.BOOKING_CONFIRMED);
        }
    }

    // ── Helper: get authenticated user ───────────────────────
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }
}
