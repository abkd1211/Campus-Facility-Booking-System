package com.groupwork.campus_facilities_booking.model.Enums;

/**
 * Full lifecycle of a booking at UG Legon.
 *
 * PENDING    → submitted, waiting for admin approval (required for large venues)
 * CONFIRMED  → approved / auto-confirmed for small bookings
 * CANCELLED  → user cancelled their own booking
 * REJECTED   → admin declined the request
 * COMPLETED  → booking period has passed and was used
 * NO_SHOW    → booking was confirmed but the user never checked in
 * EXPIRED    → session time expired and was not extended by user
 * ACTIVE     → user has checked in and session is ongoing
 */
public enum BookingStatus {
    PENDING,
    CONFIRMED,
    CANCELLED,
    REJECTED,
    COMPLETED,
    NO_SHOW,
    EXPIRED,
    ACTIVE
}
