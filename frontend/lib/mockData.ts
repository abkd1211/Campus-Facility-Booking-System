// Mock data for UI development (no integration yet)

export const MOCK_FACILITIES = [
    {
        id: 1, name: "Quantum Physics Lab",
        location: "Science Block A, Room 101",
        capacity: 40, type: "Computer Laboratory",
        rating: 4.8, reviewCount: 24,
        openingTime: "07:00:00", closingTime: "22:00:00",
        isAvailable: true,
        imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
        hasProjector: true, hasWifi: true, hasAC: true,
        description: "State-of-the-art computer laboratory equipped with 40 high-performance workstations, dual monitors, and a 4K projector. Ideal for software engineering, data science, and programming courses.",
        rules: "No food or drinks. Proper attire required.",
        requiresApproval: false,
    },
    {
        id: 2, name: "Great Hall Auditorium",
        location: "Central Campus, Main Building",
        capacity: 800, type: "Auditorium",
        rating: 4.9, reviewCount: 87,
        openingTime: "08:00:00", closingTime: "23:00:00",
        isAvailable: true,
        imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
        hasProjector: true, hasWifi: true, hasAC: true,
        description: "The iconic Great Hall at UG Legon, accommodating up to 800 guests. Used for convocations, major conferences and high-profile events. Equipped with a full PA system and video-conferencing.",
        rules: "Formal events only. Minimum 2 weeks advance booking for large events.",
        requiresApproval: true,
    },
    {
        id: 3, name: "Olympic Turf",
        location: "Sports Complex, East Campus",
        capacity: 1000, type: "Sports Facility",
        rating: 4.7, reviewCount: 56,
        openingTime: "06:00:00", closingTime: "20:00:00",
        isAvailable: false,
        imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
        hasProjector: false, hasWifi: false, hasAC: false,
        description: "Regulation-size football pitch with FIFA-approved artificial turf. Perfect for faculty and inter-hall championships. Changing rooms and floodlights available.",
        rules: "Team registration required. Cleats only — no spikes.",
        requiresApproval: false,
    },
    {
        id: 4, name: "Skyview Conference Hall",
        location: "Graduate Studies Building, 5th Floor",
        capacity: 50, type: "Conference Room",
        rating: 4.6, reviewCount: 38,
        openingTime: "08:00:00", closingTime: "21:00:00",
        isAvailable: true,
        imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
        hasProjector: true, hasWifi: true, hasAC: true,
        description: "Premium conference hall offering panoramic views of the Legon campus. Features 4K display panel, video-conferencing, and ergonomic executive seating.",
        rules: "Academic and professional use only. Contact-free entry via QR code.",
        requiresApproval: false,
    },
    {
        id: 5, name: "CPEN Lecture Theatre",
        location: "Engineering Block B, LT 1",
        capacity: 200, type: "Lecture Hall",
        rating: 4.3, reviewCount: 112,
        openingTime: "07:00:00", closingTime: "22:00:00",
        isAvailable: true,
        imageUrl: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80",
        hasProjector: true, hasWifi: true, hasAC: false,
        description: "Main lecture theatre for the Computer Engineering department. Tiered seating for 200 students, dual laser projectors, and live-streaming capabilities.",
        rules: "Lectures and approved events only. Silence during sessions.",
        requiresApproval: false,
    },
    {
        id: 6, name: "Balme Innovation Hub",
        location: "Balme Library Complex, Ground Floor",
        capacity: 80, type: "Workshop Room",
        rating: 4.5, reviewCount: 29,
        openingTime: "08:00:00", closingTime: "20:00:00",
        isAvailable: true,
        imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
        hasProjector: true, hasWifi: true, hasAC: true,
        description: "Collaborative innovation space with modular furniture, maker tools, 3D printers, and fast fiber internet. Perfect for hackathons, startup pitches, and design workshops.",
        rules: "Collaborative projects encouraged. Equipment must be returned after use.",
        requiresApproval: false,
    },
];

export const MOCK_BOOKINGS = [
    {
        id: 1,
        facilityName: "Quantum Physics Lab",
        facilityLocation: "Science Block A, Room 101",
        facilityImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
        date: "2026-02-25", startTime: "09:00", endTime: "11:00",
        purpose: "CPEN 412 Web Architecture Lab",
        attendees: 25, status: "CONFIRMED",
        createdAt: "2026-02-20T10:30:00",
    },
    {
        id: 2,
        facilityName: "Skyview Conference Hall",
        facilityLocation: "Graduate Studies, 5th Floor",
        facilityImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
        date: "2026-02-28", startTime: "14:00", endTime: "16:00",
        purpose: "SRC Executive Board Meeting",
        attendees: 12, status: "PENDING",
        createdAt: "2026-02-22T08:15:00",
    },
    {
        id: 3,
        facilityName: "Balme Innovation Hub",
        facilityLocation: "Balme Library Complex",
        facilityImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
        date: "2026-02-20", startTime: "10:00", endTime: "12:00",
        purpose: "GDG Hackathon Kick-off Session",
        attendees: 60, status: "COMPLETED",
        createdAt: "2026-02-15T11:00:00",
    },
    {
        id: 4,
        facilityName: "CPEN Lecture Theatre",
        facilityLocation: "Engineering Block B",
        facilityImage: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80",
        date: "2026-02-18", startTime: "08:00", endTime: "10:00",
        purpose: "DCIT 201 Database Systems Lecture",
        attendees: 180, status: "CANCELLED",
        createdAt: "2026-02-16T07:45:00",
    },
];

export const MOCK_NOTIFICATIONS = [
    {
        id: 1, type: "BOOKING_CONFIRMED",
        title: "Booking Confirmed 🎉",
        message: "Your booking for Quantum Physics Lab on Feb 25 at 9:00 AM is confirmed!",
        isRead: false, createdAt: "2026-02-22T10:30:00",
    },
    {
        id: 2, type: "BOOKING_PENDING",
        title: "Booking Under Review",
        message: "Your booking for Skyview Conference Hall is pending admin approval. You'll be notified soon.",
        isRead: false, createdAt: "2026-02-22T08:20:00",
    },
    {
        id: 3, type: "WAITLIST_PROMOTED",
        title: "Waitlist Promotion! 🚀",
        message: "Great news — a slot opened for Olympic Turf on Feb 24. Your booking is now confirmed.",
        isRead: false, createdAt: "2026-02-21T15:00:00",
    },
    {
        id: 4, type: "BOOKING_CANCELLED",
        title: "Booking Cancelled",
        message: "Your booking for CPEN Lecture Theatre on Feb 18 has been cancelled.",
        isRead: true, createdAt: "2026-02-18T06:50:00",
    },
    {
        id: 5, type: "SYSTEM",
        title: "Scheduled Downtime Notice",
        message: "The booking system will be unavailable from 11 PM – 1 AM tonight for maintenance.",
        isRead: true, createdAt: "2026-02-17T14:00:00",
    },
];

export const MOCK_REVIEWS = [
    {
        id: 1, rating: 5,
        userName: "Kwame Asante", userInitials: "KA",
        comment: "The lab was impeccably maintained. All workstations worked perfectly and the projector is top-notch.",
        createdAt: "2026-02-20T14:00:00",
    },
    {
        id: 2, rating: 4,
        userName: "Ama Serwaa", userInitials: "AS",
        comment: "Great space overall. AC could be a bit stronger but everything else was excellent.",
        createdAt: "2026-02-18T11:30:00",
    },
    {
        id: 3, rating: 5,
        userName: "Nana Yaw Boateng", userInitials: "NB",
        comment: "Super smooth booking process. The facility exceeded expectations for our hackathon.",
        createdAt: "2026-02-15T09:00:00",
    },
];

export const MOCK_PENDING_APPROVALS = [
    {
        id: 1, bookingId: 5,
        facilityName: "Great Hall Auditorium",
        facilityImage: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
        userName: "Accra Tech Hub Ltd", userEmail: "events@accratechhub.com", userRole: "VISITOR",
        date: "2026-03-15", startTime: "09:00", endTime: "17:00",
        purpose: "Annual Tech Summit for University Students",
        attendees: 500, submittedAt: "2026-02-22T08:00:00",
    },
    {
        id: 2, bookingId: 6,
        facilityName: "Skyview Conference Hall",
        facilityImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
        userName: "Grace Baptist Church", userEmail: "admin@gracebaptist.org", userRole: "VISITOR",
        date: "2026-03-08", startTime: "08:00", endTime: "14:00",
        purpose: "Campus Fellowship & Prayer breakfast for students",
        attendees: 45, submittedAt: "2026-02-21T16:30:00",
    },
    {
        id: 3, bookingId: 7,
        facilityName: "Great Hall Auditorium",
        facilityImage: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
        userName: "Dr. Ama Adjei", userEmail: "a.adjei@ug.edu.gh", userRole: "STAFF",
        date: "2026-03-20", startTime: "10:00", endTime: "16:00",
        purpose: "Department Inter-Faculty Symposium 2026",
        attendees: 350, submittedAt: "2026-02-20T11:15:00",
    },
];

export const MOCK_SLOTS = Array.from({ length: 28 }, (_, i) => {
    const hour = 7 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const endH = i % 2 === 0 ? hour : hour + 1;
    const endM = i % 2 === 0 ? "30" : "00";
    return {
        startTime: `${String(hour).padStart(2, "0")}:${minute}`,
        endTime: `${String(endH).padStart(2, "0")}:${endM}`,
        available: ![4, 5, 8, 9, 10].includes(i),
    };
});

export const MOCK_FACILITY_TYPES = [
    { id: 1, name: "Lecture Hall" },
    { id: 2, name: "Computer Laboratory" },
    { id: 3, name: "Sports Facility" },
    { id: 4, name: "Auditorium" },
    { id: 5, name: "Conference Room" },
    { id: 6, name: "Workshop Room" },
];
