package com.groupwork.campus_facilities_booking.model.Enums;

/**
 * WAITING  – still in the queue
 * PROMOTED – the slot freed up and this entry was converted to a booking
 * EXPIRED  – the date passed without the slot becoming available
 */
public enum WaitlistStatus {
    WAITING,
    PROMOTED,
    EXPIRED
}
