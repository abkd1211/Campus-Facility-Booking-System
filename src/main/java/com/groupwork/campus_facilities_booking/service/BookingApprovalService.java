package com.groupwork.campus_facilities_booking.service;

import com.groupwork.campus_facilities_booking.model.Entities.Booking;
import com.groupwork.campus_facilities_booking.model.Entities.BookingApproval;
import com.groupwork.campus_facilities_booking.model.Entities.User;
import com.groupwork.campus_facilities_booking.model.Enums.ApprovalDecision;
import com.groupwork.campus_facilities_booking.model.Enums.BookingStatus;
import com.groupwork.campus_facilities_booking.model.Enums.NotificationType;
import com.groupwork.campus_facilities_booking.repository.BookingApprovalRepository;
import com.groupwork.campus_facilities_booking.repository.BookingRepository;
import com.groupwork.campus_facilities_booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingApprovalService {

    private final BookingApprovalRepository approvalRepository;
    private final BookingRepository         bookingRepository;
    private final UserRepository            userRepository;
    private final NotificationService       notificationService;

    // ── Get all approval records ──────────────────────────────
    public List<BookingApproval> getAllApprovals() {
        return approvalRepository.findAll();
    }

    // ── Get all PENDING bookings ──────────────────────────────
    public List<Booking> getPendingBookings() {
        return bookingRepository.findByStatus(BookingStatus.PENDING);
    }

    // ── Get approval history for a specific booking ───────────
    public List<BookingApproval> getApprovalHistory(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));
        return approvalRepository.findByBooking(booking);
    }

    // ── Approve a booking ─────────────────────────────────────
    @Transactional
    public BookingApproval approveBooking(Long bookingId, String remarks) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only PENDING bookings can be approved. Current status: " + booking.getStatus());
        }

        User admin = getCurrentUser();

        // Update booking status
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Record the approval decision
        BookingApproval approval = BookingApproval.builder()
            .booking(booking)
            .reviewedBy(admin)
            .decision(ApprovalDecision.APPROVED)
            .remarks(remarks)
            .build();
        BookingApproval saved = approvalRepository.save(approval);

        // Notify the user who made the booking
        notificationService.sendNotification(
            booking.getUser(), booking,
            "Booking Approved!",
            "Your booking for " + booking.getFacility().getName()
                + " on " + booking.getDate()
                + " has been approved."
                + (remarks != null ? " Note: " + remarks : ""),
            NotificationType.BOOKING_CONFIRMED
        );

        return saved;
    }

    // ── Reject a booking ──────────────────────────────────────
    @Transactional
    public BookingApproval rejectBooking(Long bookingId, String remarks) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only PENDING bookings can be rejected. Current status: " + booking.getStatus());
        }

        User admin = getCurrentUser();

        // Update booking status
        booking.setStatus(BookingStatus.REJECTED);
        bookingRepository.save(booking);

        // Record the rejection
        BookingApproval approval = BookingApproval.builder()
            .booking(booking)
            .reviewedBy(admin)
            .decision(ApprovalDecision.REJECTED)
            .remarks(remarks)
            .build();
        BookingApproval saved = approvalRepository.save(approval);

        // Notify the user
        notificationService.sendNotification(
            booking.getUser(), booking,
            "Booking Rejected",
            "Unfortunately, your booking for " + booking.getFacility().getName()
                + " on " + booking.getDate() + " was not approved."
                + (remarks != null ? " Reason: " + remarks : ""),
            NotificationType.BOOKING_REJECTED
        );

        return saved;
    }

    // ── Helper ────────────────────────────────────────────────
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }
}
