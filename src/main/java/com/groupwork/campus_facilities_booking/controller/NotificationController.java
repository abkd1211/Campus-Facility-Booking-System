package com.groupwork.campus_facilities_booking.controller;

import com.groupwork.campus_facilities_booking.model.Entities.Notification;
import com.groupwork.campus_facilities_booking.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Notifications.
 *
 * GET    /notifications/my             → current user's notifications
 * GET    /notifications/my/unread      → unread count + list
 * PATCH  /notifications/{id}/read      → mark one as read
 * PATCH  /notifications/read-all       → mark all as read
 * DELETE /notifications/{id}           → delete a notification
 * POST   /notifications/announce       → broadcast announcement  [ADMIN]
 */
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    // ── GET /notifications/my ────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<List<Notification>> getMyNotifications() {
        return ResponseEntity.ok(notificationService.getNotificationsForCurrentUser());
    }

    // ── GET /notifications/my/unread ─────────────────────────
    @GetMapping("/my/unread")
    public ResponseEntity<Map<String, Object>> getUnreadNotifications() {
        List<Notification> unread = notificationService.getUnreadForCurrentUser();
        return ResponseEntity.ok(Map.of(
            "count", unread.size(),
            "notifications", unread
        ));
    }

    // ── PATCH /notifications/{id}/read ───────────────────────
    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    // ── PATCH /notifications/read-all ────────────────────────
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    // ── DELETE /notifications/{id} ───────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }

    // ── POST /notifications/announce  [ADMIN] ────────────────
    // Body: { "title": "...", "message": "Great Hall closed tomorrow" }
    @PostMapping("/announce")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> broadcastAnnouncement(
            @RequestBody Map<String, String> body) {
        notificationService.broadcastAnnouncement(body.get("title"), body.get("message"));
        return ResponseEntity.ok(Map.of("message", "Announcement sent to all users"));
    }
}
