package com.groupwork.campus_facilities_booking.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Scheduled tasks for booking session management.
 * Runs periodically to:
 *  1. Auto-mark expired bookings
 *  2. Send 5-minute expiry reminders
 */
@Service
@RequiredArgsConstructor
@EnableScheduling
public class BookingExpiryScheduler {

    private final BookingService bookingService;

    /**
     * Auto-expire bookings every minute.
     * Marks any bookings whose end time has passed as EXPIRED.
     */
    @Scheduled(fixedDelay = 60000)  // Every 60 seconds
    public void scheduleAutoExpiry() {
        try {
            bookingService.autoExpireBookings();
        } catch (Exception e) {
            // Log error but don't crash the scheduler
            System.err.println("Error in auto-expiry task: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Send expiry reminders every 30 seconds.
     * Notifies users 5 minutes before their booking expires.
     */
    @Scheduled(fixedDelay = 30000)  // Every 30 seconds
    public void scheduleExpiryReminders() {
        try {
            bookingService.sendExpiryReminders();
        } catch (Exception e) {
            // Log error but don't crash the scheduler
            System.err.println("Error in expiry reminder task: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
