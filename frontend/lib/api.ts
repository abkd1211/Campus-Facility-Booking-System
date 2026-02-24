/**
 * Centralised typed API client.
 * All calls go through `apiFetch` which automatically attaches the JWT.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, { ...options, headers });

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorBody?.message ?? `HTTP ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
    id: number;
    name: string;
    email: string;
    role: "STUDENT" | "STAFF" | "ADMIN" | "SECURITY" | "VISITOR";
    studentId?: string;
    staffId?: string;
    phone?: string;
    profilePicUrl?: string;
    isActive: boolean;
    createdAt: string;
    department?: { id: number; name: string };
}

export interface Department {
    id: number;
    name: string;
    college: string;
    hodName?: string;
    hodEmail?: string;
}

export interface FacilityType {
    id: number;
    name: string;
    description?: string;
    requiresApproval: boolean;
}

export interface Facility {
    id: number;
    name: string;
    location: string;
    capacity: number;
    facilityType: FacilityType;
    hasProjector: boolean;
    hasAirConditioning: boolean;
    hasWhiteboard: boolean;
    hasPaSystem: boolean;
    hasVideoConferencing: boolean;
    hasWifi: boolean;
    isOutdoor: boolean;
    isWheelchairAccessible: boolean;
    openingTime: string;
    closingTime: string;
    isAvailable: boolean;
    imageUrl?: string;
    rules?: string;
    description?: string;
    createdAt: string;
}

export interface TimeSlot {
    startTime: string;
    endTime: string;
    available: boolean;
}

export interface AvailabilityResponse {
    facilityId: number;
    facilityName: string;
    date: string;
    slots: TimeSlot[];
}

export interface Booking {
    id: number;
    facility: Facility;
    user: User;
    date: string;
    startTime: string;
    endTime: string;
    purpose: string;
    attendees: number;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "EXPIRED" | "REJECTED" | "ACTIVE";
    notes?: string;
    isRecurring: boolean;
    createdAt: string;
    checkInTime?: string;
    checkOutTime?: string;
}

export interface Review {
    id: number;
    rating: number;
    comment?: string;
    createdAt: string;
    user?: { id: number; name: string };
    facility?: { id: number; name: string };
    booking?: { id: number };
}

export interface RatingSummary {
    facilityId: number;
    averageRating: number;
    totalReviews: number;
}

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    booking?: { id: number } | null;
}

export interface UnreadNotifications {
    count: number;
    notifications: Notification[];
}

export interface BookingApproval {
    id: number;
    booking: Booking;
    reviewedBy?: User;
    decision: "APPROVED" | "REJECTED";
    remarks?: string;
    decidedAt: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
    login: (email: string, password: string) =>
        apiFetch<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }),

    register: (body: {
        name: string;
        email: string;
        passwordHash: string;
        role?: string;
        studentId?: string;
        staffId?: string;
        phone?: string;
        department?: { id: number } | null;
    }) =>
        apiFetch<AuthResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    me: () => apiFetch<User>("/auth/me"),

    logout: () =>
        apiFetch<{ message: string }>("/auth/logout", { method: "POST" }),

    changePassword: (currentPassword: string, newPassword: string) =>
        apiFetch<{ message: string }>("/auth/change-password", {
            method: "POST",
            body: JSON.stringify({ currentPassword, newPassword }),
        }),
};

// ─── Departments ──────────────────────────────────────────────────────────────

export const departments = {
    list: () => apiFetch<Department[]>("/departments"),
};

// ─── Facility Types ───────────────────────────────────────────────────────────

export const facilityTypes = {
    list: () => apiFetch<FacilityType[]>("/facility-types"),
};

// ─── Facilities ───────────────────────────────────────────────────────────────

export const facilities = {
    list: () => apiFetch<Facility[]>("/facilities"),

    get: (id: number) => apiFetch<Facility>(`/facilities/${id}`),

    search: (params: Record<string, string>) => {
        const qs = new URLSearchParams(params).toString();
        return apiFetch<Facility[]>(`/facilities/search${qs ? `?${qs}` : ""}`);
    },

    availability: (facilityId: number, date: string) =>
        apiFetch<AvailabilityResponse>(
            `/facilities/${facilityId}/availability?date=${date}`
        ),

    toggleAvailability: (id: number) =>
        apiFetch<Facility>(`/facilities/${id}/toggle-availability`, { method: "PATCH" }),

    remove: (id: number) => apiFetch<void>(`/facilities/${id}`, { method: "DELETE" }),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookings = {
    my: () => apiFetch<Booking[]>("/bookings/my"),

    create: (body: {
        facility: { id: number };
        user: { id: number };
        date: string;
        startTime: string;
        endTime: string;
        purpose: string;
        attendees: number;
        notes?: string;
        isRecurring?: boolean;
    }) =>
        apiFetch<Booking>("/bookings", {
            method: "POST",
            body: JSON.stringify({ isRecurring: false, ...body }),
        }),

    cancel: (id: number) =>
        apiFetch<Booking>(`/bookings/${id}/cancel`, { method: "PATCH" }),

    checkIn: (id: number) =>
        apiFetch<Booking>(`/bookings/${id}/check-in`, { method: "PATCH" }),

    checkOut: (id: number) =>
        apiFetch<Booking>(`/bookings/${id}/check-out`, { method: "PATCH" }),

    remove: (id: number) =>
        apiFetch<void>(`/bookings/${id}`, { method: "DELETE" }),

    all: () => apiFetch<Booking[]>("/bookings"),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviews = {
    forFacility: (facilityId: number) =>
        apiFetch<Review[]>(`/reviews/facility/${facilityId}`),

    rating: (facilityId: number) =>
        apiFetch<RatingSummary>(`/reviews/facility/${facilityId}/rating`),

    submit: (body: {
        facility: { id: number };
        user: { id: number };
        booking: { id: number };
        rating: number;
        comment?: string;
    }) =>
        apiFetch<Review>("/reviews", {
            method: "POST",
            body: JSON.stringify(body),
        }),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = {
    my: () => apiFetch<Notification[]>("/notifications/my"),

    unread: () => apiFetch<UnreadNotifications>("/notifications/my/unread"),

    markRead: (id: number) =>
        apiFetch<Notification>(`/notifications/${id}/read`, { method: "PATCH" }),

    markAllRead: () =>
        apiFetch<{ message: string }>("/notifications/read-all", {
            method: "PATCH",
        }),

    delete: (id: number) =>
        apiFetch<void>(`/notifications/${id}`, { method: "DELETE" }),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = {
    update: (id: number, body: Partial<User>) =>
        apiFetch<User>(`/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        }),

    list: () => apiFetch<User[]>("/users"),

    activate: (id: number) => apiFetch<User>(`/users/${id}/activate`, { method: "PATCH" }),
    deactivate: (id: number) => apiFetch<User>(`/users/${id}/deactivate`, { method: "PATCH" }),

    changeRole: (id: number, role: string) =>
        apiFetch<User>(`/users/${id}/role?role=${role}`, { method: "PATCH" }),

    remove: (id: number) => apiFetch<void>(`/users/${id}`, { method: "DELETE" }),
};

// ─── Approvals ────────────────────────────────────────────────────────────────

export const approvals = {
    pending: () => apiFetch<Booking[]>("/approvals/pending"),

    approve: (bookingId: number, remarks?: string) =>
        apiFetch<BookingApproval>(`/approvals/${bookingId}/approve`, {
            method: "POST",
            body: JSON.stringify({ remarks: remarks ?? "" }),
        }),

    reject: (bookingId: number, remarks?: string) =>
        apiFetch<BookingApproval>(`/approvals/${bookingId}/reject`, {
            method: "POST",
            body: JSON.stringify({ remarks: remarks ?? "" }),
        }),
};
