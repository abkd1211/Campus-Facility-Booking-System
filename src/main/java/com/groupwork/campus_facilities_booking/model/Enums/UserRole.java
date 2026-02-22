package com.groupwork.campus_facilities_booking.model.Enums;

/**
 * Roles within the UG Legon Facility Booking System.
 *
 * STUDENT – Can view facilities, create and manage their own bookings.
 * STAFF – Same as STUDENT plus can book on behalf of a department.
 * ADMIN – Full access: approve/reject bookings, manage facilities and users.
 * SECURITY – Read-only view of today's confirmed bookings for access control.
 * VISITOR – External organizations (companies, churches, NGOs, etc.) that
 * want to use campus facilities for events or programs.
 * All VISITOR bookings require admin approval regardless of
 * facility type.
 */
public enum UserRole {
    STUDENT,
    STAFF,
    ADMIN,
    SECURITY,
    VISITOR
}
