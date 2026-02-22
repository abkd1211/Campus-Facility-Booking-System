package com.groupwork.campus_facilities_booking.service;

import com.groupwork.campus_facilities_booking.model.Entities.Booking;
import com.groupwork.campus_facilities_booking.model.Entities.Notification;
import com.groupwork.campus_facilities_booking.model.Entities.User;
import com.groupwork.campus_facilities_booking.model.Enums.NotificationType;
import com.groupwork.campus_facilities_booking.repository.NotificationRepository;
import com.groupwork.campus_facilities_booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;

    // ── Get all notifications for current user ────────────────
    public List<Notification> getNotificationsForCurrentUser() {
        User user = getCurrentUser();
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    // ── Get unread notifications for current user ─────────────
    public List<Notification> getUnreadForCurrentUser() {
        User user = getCurrentUser();
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
    }

    // ── Mark single notification as read ─────────────────────
    @Transactional
    public Notification markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    // ── Mark all notifications as read ────────────────────────
    @Transactional
    public void markAllAsRead() {
        User user = getCurrentUser();
        List<Notification> unread = notificationRepository
            .findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    // ── Delete a notification ─────────────────────────────────
    @Transactional
    public void deleteNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
        notificationRepository.delete(notification);
    }

    // ── Broadcast announcement to ALL active users ────────────
    @Transactional
    public void broadcastAnnouncement(String title, String message) {
        List<User> allUsers = userRepository.findByIsActiveTrue();
        List<Notification> notifications = allUsers.stream()
            .map(user -> Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(NotificationType.GENERAL_ANNOUNCEMENT)
                .isRead(false)
                .build())
            .toList();
        notificationRepository.saveAll(notifications);
    }

    // ── Internal helper — called by other services ────────────
    @Transactional
    public void sendNotification(User user, Booking booking,
                                  String title, String message,
                                  NotificationType type) {
        Notification notification = Notification.builder()
            .user(user)
            .booking(booking)
            .title(title)
            .message(message)
            .type(type)
            .isRead(false)
            .build();
        notificationRepository.save(notification);
    }

    // ── Helper ────────────────────────────────────────────────
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }
}
