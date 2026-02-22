package com.groupwork.campus_facilities_booking.model.Enums;

/**
 * The event that triggered a Notification.
 */
public enum NotificationType {
    BOOKING_CONFIRMED,
    BOOKING_REJECTED,
    BOOKING_CANCELLED,
    BOOKING_REMINDER,       // sent 1 hour before a booking starts
    WAITLIST_PROMOTED,      // user moved from waitlist to a confirmed booking
    MAINTENANCE_ALERT,      // a facility the user books often is going offline
    GENERAL_ANNOUNCEMENT    // broadcast from admin (e.g. Great Hall closed today)
}
