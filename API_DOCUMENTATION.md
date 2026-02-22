# Campus Facilities Booking System — API Documentation

**Base URL:** `http://localhost:8080`  
**Auth:** JWT Bearer Token — include in header as `Authorization: Bearer <token>`  
**Content-Type:** `application/json`

---

## 🗂️ Table of Contents

| Module | Base Path |
|--------|-----------|
| [Authentication](#1-authentication) | `/auth` |
| [Users](#2-users) | `/users` |
| [Departments](#3-departments) | `/departments` |
| [Facility Types](#4-facility-types) | `/facility-types` |
| [Facilities](#5-facilities) | `/facilities` |
| [Bookings](#6-bookings) | `/bookings` |
| [Booking Approvals](#7-booking-approvals) | `/approvals` |
| [Reviews](#8-reviews) | `/reviews` |
| [Waitlist](#9-waitlist) | `/waitlist` |
| [Maintenance](#10-maintenance-schedules) | `/maintenance` |
| [Notifications](#11-notifications) | `/notifications` |

---

## Legend

| Badge | Meaning |
|-------|---------|
| 🌐 **Public** | No token required |
| 🔒 **Auth** | Any logged-in user |
| 👤 **Owner** | Only the resource owner OR admin |
| 🛡️ **Admin** | `ROLE_ADMIN` only |
| 🔐 **Admin/Security** | `ROLE_ADMIN` or `ROLE_SECURITY` |
| ✅ **Frontend** | Implemented in the Next.js frontend |

---

## Standard Error Response

All errors follow this shape:

```json
{
  "timestamp": "2026-02-22T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Attendees (150) exceeds facility capacity (40)."
}
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request / business logic violation |
| `401` | Missing or invalid JWT |
| `403` | Authenticated but insufficient role |
| `404` | Resource not found |
| `422` | Validation failed (`@Valid` errors) |
| `500` | Unexpected server error |

---

## 1. Authentication

### `POST /auth/register` — 🌐 Public | ✅ Frontend
Register a new user account.

**Request Body:**
```json
{
  "name":        "Kofi Mensah",
  "email":       "kofi.mensah@st.ug.edu.gh",
  "passwordHash": "mypassword123",
  "role":        "STUDENT",
  "studentId":   "10834201",
  "staffId":     null,
  "phone":       "0244123456",
  "department":  { "id": 2 }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | Full name |
| `email` | string | ✅ | Must be unique |
| `passwordHash` | string | ✅ | Plain text — server BCrypts it |
| `role` | enum | ❌ | `STUDENT`(default), `STAFF`, `VISITOR` |
| `studentId` | string | ❌ | UG 8-digit student ID |
| `staffId` | string | ❌ | e.g. `ST-00412` |
| `phone` | string | ❌ | |
| `department.id` | Long | ❌ | Link to a department |

**Response `201`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 5, "name": "Kofi Mensah", "email": "kofi.mensah@st.ug.edu.gh",
    "role": "STUDENT", "isActive": true, "createdAt": "2026-02-22T12:00:00"
  }
}
```

---

### `POST /auth/login` — 🌐 Public | ✅ Frontend
Authenticate and receive a JWT.

**Request Body:**
```json
{ "email": "kofi.mensah@st.ug.edu.gh", "password": "mypassword123" }
```

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": 5, "name": "Kofi Mensah", "role": "STUDENT", ... }
}
```

---

### `POST /auth/logout` — 🔒 Auth | ✅ Frontend
Stateless logout — instructs client to discard the token.

**Response `200`:**
```json
{ "message": "Logged out successfully" }
```

---

### `GET /auth/me` — 🔒 Auth | ✅ Frontend
Returns the currently authenticated user object.

**Response `200`:** Full `User` object.

---

### `POST /auth/change-password` — 🔒 Auth

**Request Body:**
```json
{ "currentPassword": "oldpass", "newPassword": "newpass123" }
```

**Response `200`:**
```json
{ "message": "Password changed successfully" }
```

---

## 2. Users

### `GET /users` — 🛡️ Admin
Returns all registered users.

**Response `200`:** Array of `User` objects.

---

### `GET /users/me` — 🔒 Auth | ✅ Frontend
Returns the logged-in user's profile.

**Response `200`:** `User` object.

---

### `GET /users/{id}` — 🛡️ Admin
Returns a single user by ID.

**Response `200`:** `User` object.  
**Response `400`:** User not found.

---

### `GET /users/role/{role}` — 🛡️ Admin
Filter users by role.

**Path param `role`:** `STUDENT` | `STAFF` | `ADMIN` | `SECURITY` | `VISITOR`

**Response `200`:** Array of `User` objects.

---

### `GET /users/department/{deptId}` — 🛡️ Admin
All users assigned to a specific department.

**Response `200`:** Array of `User` objects.

---

### `PUT /users/{id}` — 👤 Owner or Admin | ✅ Frontend
Update a user's profile information.

**Request Body:**
```json
{
  "name":     "Kofi Asante Mensah",
  "email":    "kofi.mensah@st.ug.edu.gh",
  "passwordHash": "ignored-field",
  "studentId": "10834201",
  "phone":    "0244999888",
  "profilePicUrl": "https://example.com/avatar.jpg"
}
```

**Response `200`:** Updated `User` object.

---

### `PATCH /users/{id}/role?role=STAFF` — 🛡️ Admin
Change a user's role.

**Query param `role`:** `STUDENT` | `STAFF` | `ADMIN` | `SECURITY` | `VISITOR`

**Response `200`:** Updated `User` object.

---

### `PATCH /users/{id}/deactivate` — 🛡️ Admin
Soft-disable an account (user cannot log in).

**Response `200`:** Updated `User` object.

---

### `PATCH /users/{id}/activate` — 🛡️ Admin
Re-enable a deactivated account.

**Response `200`:** Updated `User` object.

---

### `DELETE /users/{id}` — 🛡️ Admin
Permanently delete a user.

**Response `204`:** No content.

---

## 3. Departments

### `GET /departments` — 🌐 Public | ✅ Frontend
All departments (used in registration dropdown).

**Response `200`:**
```json
[
  { "id": 1, "name": "Computer Engineering", "college": "College of Engineering Sciences", "hodName": "Prof. Agyemang", "hodEmail": "agyemang@ug.edu.gh" },
  ...
]
```

---

### `GET /departments/{id}` — 🌐 Public
Single department by ID.

---

### `GET /departments/college/{collegeName}` — 🌐 Public
All departments within a college.

**Example:** `GET /departments/college/College%20of%20Engineering%20Sciences`

---

### `POST /departments` — 🛡️ Admin

**Request Body:**
```json
{
  "name":     "Computer Engineering",
  "college":  "College of Engineering Sciences",
  "hodName":  "Prof. Agyemang",
  "hodEmail": "agyemang@ug.edu.gh"
}
```

**Response `201`:** Created `Department` object.

---

### `PUT /departments/{id}` — 🛡️ Admin
Update department details. Same body as POST.

**Response `200`:** Updated `Department` object.

---

### `DELETE /departments/{id}` — 🛡️ Admin

**Response `204`:** No content.

---

## 4. Facility Types

### `GET /facility-types` — 🌐 Public | ✅ Frontend
All facility types (used in search filters and forms).

**Response `200`:**
```json
[
  { "id": 1, "name": "Lecture Hall", "description": "Large teaching spaces...", "requiresApproval": false },
  { "id": 4, "name": "Auditorium",   "description": "Large-capacity venues...", "requiresApproval": true  },
  ...
]
```

---

### `GET /facility-types/{id}` — 🌐 Public
Single facility type by ID.

---

### `POST /facility-types` — 🛡️ Admin

**Request Body:**
```json
{
  "name":              "Workshop Room",
  "description":       "Hands-on workshop and maker spaces.",
  "requiresApproval":  false
}
```

**Response `201`:** Created `FacilityType` object.  
**Response `400`:** Name already exists.

---

### `PUT /facility-types/{id}` — 🛡️ Admin
Update a facility type. Same body as POST.

**Response `200`:** Updated `FacilityType` object.

---

### `DELETE /facility-types/{id}` — 🛡️ Admin

**Response `204`:** No content.

---

## 5. Facilities

### `GET /facilities` — 🌐 Public | ✅ Frontend
All facilities.

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "CPEN Computer Lab 1",
    "location": "Engineering Block B, Room 101",
    "capacity": 40,
    "facilityType": { "id": 2, "name": "Computer Laboratory", ... },
    "hasProjector": true,
    "hasAirConditioning": true,
    "hasWhiteboard": true,
    "hasPaSystem": false,
    "hasVideoConferencing": false,
    "hasWifi": true,
    "isOutdoor": false,
    "isWheelchairAccessible": false,
    "openingTime": "07:00:00",
    "closingTime": "22:00:00",
    "isAvailable": true,
    "imageUrl": "https://...",
    "rules": "No food or drinks inside the lab.",
    "createdAt": "2026-02-20T10:00:00"
  },
  ...
]
```

---

### `GET /facilities/{id}` — 🌐 Public | ✅ Frontend
Single facility by ID.

---

### `GET /facilities/search` — 🌐 Public | ✅ Frontend
Filter/search facilities. All params are optional.

**Query Params:**

| Param | Type | Example |
|-------|------|---------|
| `name` | string | `?name=lab` |
| `typeId` | Long | `?typeId=2` |
| `departmentId` | Long | `?departmentId=3` |
| `hasProjector` | boolean | `?hasProjector=true` |
| `hasAirConditioning` | boolean | `?hasAirConditioning=true` |
| `hasWifi` | boolean | `?hasWifi=true` |
| `isOutdoor` | boolean | `?isOutdoor=false` |
| `minCapacity` | integer | `?minCapacity=50` |

**Example:** `GET /facilities/search?name=lab&hasProjector=true&minCapacity=20`

**Response `200`:** Filtered array of `Facility` objects.

---

### `GET /facilities/type/{typeId}` — 🌐 Public | ✅ Frontend
All facilities of a specific type.

---

### `GET /facilities/department/{deptId}` — 🌐 Public
All facilities owned by a department.

---

### `GET /facilities/{id}/availability?date=2026-02-20` — 🌐 Public | ✅ Frontend
Returns 30-minute booking slots for a facility on a given date.

**Response `200`:**
```json
{
  "facilityId": 1,
  "facilityName": "CPEN Computer Lab 1",
  "date": "2026-02-20",
  "slots": [
    { "startTime": "07:00", "endTime": "07:30", "available": true  },
    { "startTime": "07:30", "endTime": "08:00", "available": true  },
    { "startTime": "09:00", "endTime": "09:30", "available": false },
    { "startTime": "09:30", "endTime": "10:00", "available": false }
  ]
}
```

---

### `POST /facilities` — 🛡️ Admin

**Request Body:**
```json
{
  "name":                 "CPEN Computer Lab 2",
  "location":             "Engineering Block B, Room 102",
  "capacity":             40,
  "facilityType":         { "id": 2 },
  "owningDepartment":     { "id": 1 },
  "hasProjector":         true,
  "hasAirConditioning":   true,
  "hasWhiteboard":        true,
  "hasPaSystem":          false,
  "hasVideoConferencing": false,
  "hasWifi":              true,
  "isOutdoor":            false,
  "isWheelchairAccessible": false,
  "openingTime":          "07:00:00",
  "closingTime":          "22:00:00",
  "imageUrl":             "https://example.com/lab2.jpg",
  "rules":                "No food or drinks inside the lab."
}
```

**Response `201`:** Created `Facility` object.

---

### `PUT /facilities/{id}` — 🛡️ Admin
Update facility details. Same body as POST.

**Response `200`:** Updated `Facility` object.

---

### `PATCH /facilities/{id}/toggle-availability` — 🛡️ Admin
Enable or disable a facility (e.g. during renovation). No body needed.

**Response `200`:** Updated `Facility` with toggled `isAvailable`.

---

### `DELETE /facilities/{id}` — 🛡️ Admin

**Response `204`:** No content.

---

## 6. Bookings

### `GET /bookings` — 🛡️ Admin
All bookings in the system.

**Response `200`:** Array of `Booking` objects.

---

### `GET /bookings/my` — 🔒 Auth | ✅ Frontend
Returns the current user's bookings, newest first.

**Response `200`:** Array of `Booking` objects.

---

### `GET /bookings/{id}` — 🔒 Auth
Single booking by ID.

---

### `GET /bookings/facility/{facilityId}` — 🔒 Auth | ✅ Frontend
All bookings for a facility. Optionally filter by date.

**Query Params:**

| Param | Type | Example |
|-------|------|---------|
| `date` | date | `?date=2026-02-20` |

---

### `GET /bookings/status/{status}` — 🛡️ Admin
Filter bookings by status.

**Path param `status`:** `PENDING` | `CONFIRMED` | `CANCELLED` | `REJECTED` | `COMPLETED` | `NO_SHOW` | `EXPIRED` | `ACTIVE`

---

### `GET /bookings/today` — 🔐 Admin/Security
Today's confirmed bookings (used by security officers for access control).

---

### `GET /bookings/availability?facilityId=1&date=2026-02-20` — 🌐 Public | ✅ Frontend
Same as `GET /facilities/{id}/availability` — returns 30-min slots.

---

### `POST /bookings` — 🔒 Auth | ✅ Frontend
Create a new booking.

> ⚠️ **Auto-approval rules:**
> - **VISITOR users** → always `PENDING` (requires admin approval)
> - **Facility type with `requiresApproval: true`** → always `PENDING`
> - All others → auto `CONFIRMED`

**Validations:**
- Start time must be within facility opening/closing hours
- End time must be after start time, minimum 30-minute duration
- Attendees must not exceed facility capacity
- No conflict with existing `CONFIRMED` or `PENDING` bookings
- Date must not fall within a maintenance window

**Request Body:**
```json
{
  "facility":    { "id": 1 },
  "user":        { "id": 1 },
  "date":        "2026-02-20",
  "startTime":   "09:00:00",
  "endTime":     "10:00:00",
  "purpose":     "CPEN 412 Web Architecture Lab",
  "attendees":   25,
  "isRecurring": false,
  "notes":       "Please ensure projector is on before 9am"
}
```

**Response `201`:** Created `Booking` object.

**Possible `400` errors:**
```
"Facility 'X' is currently unavailable."
"Booking must be within operating hours: 07:00 – 22:00"
"End time must be after start time."
"Minimum booking duration is 30 minutes."
"Attendees (50) exceeds facility capacity (40)."
"Facility 'X' is under maintenance on 2026-02-20"
"Time slot 09:00 – 10:00 on 2026-02-20 is already booked."
```

---

### `PUT /bookings/{id}` — 👤 Owner or Admin
Update a booking's date, time, purpose, or attendees.
Only `PENDING` or `CONFIRMED` bookings can be updated.

**Request Body:**
```json
{
  "facility":    { "id": 1 },
  "user":        { "id": 1 },
  "date":        "2026-02-21",
  "startTime":   "10:00:00",
  "endTime":     "11:00:00",
  "purpose":     "Updated: SRC Executive Meeting",
  "attendees":   10,
  "isRecurring": false
}
```

**Response `200`:** Updated `Booking` object.

---

### `PATCH /bookings/{id}/cancel` — 👤 Owner or Admin | ✅ Frontend
Cancel a booking. Cannot cancel a `COMPLETED` booking.

**Response `200`:** Updated `Booking` with `status: "CANCELLED"`.

---

### `PATCH /bookings/{id}/extend` — 🔒 Auth
Extend a booking session by 30 minutes. Max 2 extensions (90 min total).

**Response `200`:** Updated `Booking` with new `endTime`.

**Possible `400` errors:**
```
"Only confirmed or active bookings can be extended."
"Maximum extensions (2) reached for this booking."
```

---

### `PATCH /bookings/{id}/check-in` — 🔐 Admin/Security
Mark a user as checked in. Only `CONFIRMED` bookings.

**Response `200`:** Updated `Booking` with `checkInTime` set.

---

### `PATCH /bookings/{id}/check-out` — 🔐 Admin/Security
Mark a user as checked out. Sets status to `COMPLETED`.

**Response `200`:** Updated `Booking` with `checkOutTime` and `status: "COMPLETED"`.

---

### `DELETE /bookings/{id}` — 🛡️ Admin
Hard delete a booking and nullify linked notifications.

**Response `204`:** No content.

---

## 7. Booking Approvals

> All endpoints in this module are **🛡️ Admin only**.

---

### `GET /approvals` — 🛡️ Admin
All approval decisions ever made.

**Response `200`:**
```json
[
  {
    "id": 1,
    "booking":    { "id": 3, "purpose": "Annual Tech Fair", ... },
    "reviewedBy": { "id": 1, "name": "Admin User", ... },
    "decision":   "APPROVED",
    "remarks":    "Confirmed — venue is free.",
    "decidedAt":  "2026-02-20T09:15:00"
  },
  ...
]
```

---

### `GET /approvals/pending` — 🛡️ Admin
All bookings currently in `PENDING` status (the approval queue).

---

### `GET /approvals/booking/{bookingId}` — 🛡️ Admin
Full approval history for a specific booking.

---

### `POST /approvals/{bookingId}/approve` — 🛡️ Admin
Approve a pending booking. Sets booking status to `CONFIRMED`.

**Request Body (optional):**
```json
{ "remarks": "Approved — venue confirmed available." }
```

**Response `200`:** `BookingApproval` object.

---

### `POST /approvals/{bookingId}/reject` — 🛡️ Admin
Reject a pending booking. Sets booking status to `REJECTED`.

**Request Body (optional):**
```json
{ "remarks": "Clashes with convocation rehearsal on that date." }
```

**Response `200`:** `BookingApproval` object.

---

## 8. Reviews

### `GET /reviews/facility/{facilityId}` — 🌐 Public | ✅ Frontend
All reviews for a facility.

**Response `200`:**
```json
[
  {
    "id": 1,
    "rating":    4,
    "comment":   "Great space, projector worked perfectly.",
    "createdAt": "2026-02-21T14:00:00"
  },
  ...
]
```

---

### `GET /reviews/facility/{facilityId}/rating` — 🌐 Public | ✅ Frontend
Average star rating summary for a facility.

**Response `200`:**
```json
{
  "facilityId":    1,
  "averageRating": 4.2,
  "totalReviews":  15
}
```

---

### `GET /reviews/my` — 🔒 Auth
Current user's submitted reviews.

---

### `POST /reviews` — 🔒 Auth | ✅ Frontend
Submit a review. Only allowed if the referenced booking is `COMPLETED`.
One review per booking (enforced by unique constraint).

**Request Body:**
```json
{
  "facility": { "id": 1 },
  "user":     { "id": 1 },
  "booking":  { "id": 2 },
  "rating":   4,
  "comment":  "Projector was fine, AC was a bit cold."
}
```

| Field | Constraint |
|-------|-----------|
| `rating` | Integer `1`–`5` |
| `comment` | Optional free text |
| `booking.id` | Must be a `COMPLETED` booking |

**Response `201`:** Created `Review` object.

---

### `DELETE /reviews/{id}` — 👤 Owner or Admin
Delete a review.

**Response `204`:** No content.

---

## 9. Waitlist

### `GET /waitlist` — 🛡️ Admin
All waitlist entries.

---

### `GET /waitlist/my` — 🔒 Auth
Current user's waitlist entries.

**Response `200`:**
```json
[
  {
    "id": 1,
    "facility":  { "id": 1, "name": "CPEN Computer Lab 1" },
    "date":      "2026-02-20",
    "startTime": "09:00:00",
    "endTime":   "10:00:00",
    "purpose":   "Backup slot for CPEN lab",
    "position":  1,
    "status":    "WAITING",
    "joinedAt":  "2026-02-19T08:00:00"
  }
]
```

---

### `GET /waitlist/facility/{facilityId}` — 🛡️ Admin
Waitlist queue for a specific facility.

---

### `POST /waitlist` — 🔒 Auth
Join the waitlist for a fully-booked slot.
> If the existing booking is cancelled, the system auto-promotes the first person in queue and creates a confirmed booking for them.

**Request Body:**
```json
{
  "facility":  { "id": 1 },
  "user":      { "id": 1 },
  "date":      "2026-02-20",
  "startTime": "09:00:00",
  "endTime":   "10:00:00",
  "purpose":   "Backup slot for CPEN 412 lab session",
  "position":  1
}
```

**Response `201`:** Created `WaitlistEntry`.

---

### `DELETE /waitlist/{id}` — 👤 Owner
Leave the waitlist.

**Response `204`:** No content.

---

## 10. Maintenance Schedules

> All endpoints are **🛡️ Admin only**. Maintenance windows block bookings for the affected facility on all covered dates.

---

### `GET /maintenance` — 🛡️ Admin
All scheduled maintenance windows.

**Response `200`:**
```json
[
  {
    "id": 1,
    "facility":   { "id": 1, "name": "CPEN Computer Lab 1" },
    "startDate":  "2026-03-01",
    "endDate":    "2026-03-07",
    "reason":     "Annual electrical inspection.",
    "createdAt":  "2026-02-20T10:00:00"
  }
]
```

---

### `GET /maintenance/{id}` — 🛡️ Admin
Single maintenance record.

---

### `GET /maintenance/facility/{facilityId}` — 🛡️ Admin
All maintenance windows for a specific facility.

---

### `GET /maintenance/active` — 🛡️ Admin
Currently active maintenance windows (today falls between `startDate` and `endDate`).

---

### `POST /maintenance` — 🛡️ Admin
Schedule a maintenance window.

**Request Body:**
```json
{
  "facility":  { "id": 1 },
  "startDate": "2026-03-01",
  "endDate":   "2026-03-07",
  "reason":    "Annual electrical inspection and rewiring."
}
```

**Response `201`:** Created `MaintenanceSchedule`.

---

### `PUT /maintenance/{id}` — 🛡️ Admin
Update a maintenance window. Same body as POST.

**Response `200`:** Updated `MaintenanceSchedule`.

---

### `DELETE /maintenance/{id}` — 🛡️ Admin

**Response `204`:** No content.

---

## 11. Notifications

> Notifications are generated automatically by the system on booking events. Users cannot create them directly (except admins broadcasting).

---

### `GET /notifications/my` — 🔒 Auth | ✅ Frontend
All notifications for the current user, newest first.

**Response `200`:**
```json
[
  {
    "id":        1,
    "title":     "Booking Confirmed",
    "message":   "Your booking for CPEN Computer Lab 1 on 2026-02-20 is confirmed!",
    "type":      "BOOKING_CONFIRMED",
    "isRead":    false,
    "createdAt": "2026-02-20T09:00:00"
  },
  ...
]
```

---

### `GET /notifications/my/unread` — 🔒 Auth | ✅ Frontend
Count and list of unread notifications.

**Response `200`:**
```json
{
  "count": 3,
  "notifications": [ ... ]
}
```

---

### `PATCH /notifications/{id}/read` — 🔒 Auth | ✅ Frontend
Mark a single notification as read.

**Response `200`:** Updated `Notification`.

---

### `PATCH /notifications/read-all` — 🔒 Auth | ✅ Frontend
Mark all of the user's notifications as read.

**Response `200`:**
```json
{ "message": "All notifications marked as read" }
```

---

### `DELETE /notifications/{id}` — 🔒 Auth
Delete a notification.

**Response `204`:** No content.

---

### `POST /notifications/announce` — 🛡️ Admin
Broadcast an announcement to all registered users.

**Request Body:**
```json
{
  "title":   "Scheduled Downtime",
  "message": "The booking system will be unavailable from 11 PM – 1 AM tonight."
}
```

**Response `200`:**
```json
{ "message": "Announcement sent to all users" }
```

---

## 🖥️ Frontend Implementation Scope (Next.js)

The following is the agreed set of pages/features to implement for the class demo. Endpoints marked ✅ above are in scope.

### Pages

| Page | Endpoints Used |
|------|---------------|
| **Login / Register** | `POST /auth/login`, `POST /auth/register` |
| **Home / Browse Facilities** | `GET /facilities`, `GET /facility-types`, `GET /facilities/search` |
| **Facility Detail** | `GET /facilities/{id}`, `GET /facilities/{id}/availability`, `GET /reviews/facility/{id}/rating`, `GET /reviews/facility/{id}` |
| **Book a Facility** | `POST /bookings`, `GET /bookings/availability` |
| **My Bookings** | `GET /bookings/my`, `PATCH /bookings/{id}/cancel` |
| **Submit a Review** | `POST /reviews` |
| **Notifications** | `GET /notifications/my`, `GET /notifications/my/unread`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` |
| **Profile** | `GET /auth/me`, `PUT /users/{id}` |
| **Department Dropdown** | `GET /departments` (registration form) |
| **Admin — Approvals** | `GET /approvals/pending`, `POST /approvals/{id}/approve`, `POST /approvals/{id}/reject` |

### Out of Scope (backend complete, no frontend)
- Waitlist management UI
- Maintenance schedule UI
- Full user management UI
- Security officer check-in/check-out UI
- Booking extension UI
- Broadcast announcements UI

---

## 🔄 Automatic Background Tasks

These run server-side on a schedule — no API call needed.

| Task | Frequency | What it does |
|------|-----------|-------------|
| Auto-expire bookings | Every 60 seconds | Sets `CONFIRMED`/`ACTIVE` bookings past their end time to `EXPIRED` |
| Expiry reminders | Every 30 seconds | Sends a notification 5 minutes before a booking expires |
| Waitlist promotion | On booking cancel | Promotes the first `WAITING` entry to a `CONFIRMED` booking |

---

## 🔑 JWT Notes

- Token lifetime: **24 hours** (`app.jwt.expiration-ms=86400000`)
- Algorithm: HS256
- Include in every protected request: `Authorization: Bearer <your_token>`
- On expiry, the user must log in again to obtain a fresh token
