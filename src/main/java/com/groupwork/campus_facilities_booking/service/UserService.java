package com.groupwork.campus_facilities_booking.service;

import com.groupwork.campus_facilities_booking.model.Entities.Department;
import com.groupwork.campus_facilities_booking.model.Entities.User;
import com.groupwork.campus_facilities_booking.model.Enums.UserRole;
import com.groupwork.campus_facilities_booking.repository.BookingApprovalRepository;
import com.groupwork.campus_facilities_booking.repository.BookingRepository;
import com.groupwork.campus_facilities_booking.repository.DepartmentRepository;
import com.groupwork.campus_facilities_booking.repository.MaintenanceRepository;
import com.groupwork.campus_facilities_booking.repository.NotificationRepository;
import com.groupwork.campus_facilities_booking.repository.ReviewRepository;
import com.groupwork.campus_facilities_booking.repository.UserRepository;
import com.groupwork.campus_facilities_booking.repository.WaitlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final BookingApprovalRepository bookingApprovalRepository;
    private final BookingRepository bookingRepository;
    private final NotificationRepository notificationRepository;
    private final ReviewRepository reviewRepository;
    private final WaitlistRepository waitlistRepository;
    private final MaintenanceRepository maintenanceRepository;

    // ── Spring Security — load user by email ─────────────────
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No user found with email: " + email));
    }

    // ── Get all users ─────────────────────────────────────────
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ── Get single user ───────────────────────────────────────
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    // ── Get currently authenticated user ─────────────────────
    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }

    // ── Get users by role ─────────────────────────────────────
    public List<User> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    // ── Get users by department ───────────────────────────────
    public List<User> getUsersByDepartment(Long deptId) {
        Department dept = departmentRepository.findById(deptId)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + deptId));
        return userRepository.findByDepartment(dept);
    }

    // ── Update user profile ───────────────────────────────────
    @Transactional
    public User updateUser(Long id, User updated) {
        User existing = getUserById(id);

        existing.setName(updated.getName());
        existing.setPhone(updated.getPhone());
        existing.setProfilePicUrl(updated.getProfilePicUrl());
        existing.setStudentId(updated.getStudentId());
        existing.setStaffId(updated.getStaffId());

        if (updated.getDepartment() != null && updated.getDepartment().getId() != null) {
            Department dept = departmentRepository.findById(updated.getDepartment().getId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            existing.setDepartment(dept);
        }

        return userRepository.save(existing);
    }

    // ── Change user role ──────────────────────────────────────
    @Transactional
    public User changeRole(Long id, UserRole newRole) {
        User user = getUserById(id);
        user.setRole(newRole);
        return userRepository.save(user);
    }

    // ── Activate / Deactivate account ────────────────────────
    @Transactional
    public User setActiveStatus(Long id, boolean isActive) {
        User user = getUserById(id);
        user.setIsActive(isActive);
        return userRepository.save(user);
    }

    // ── Delete user ───────────────────────────────────────────
    /**
     * Deletion order satisfies every FK constraint:
     *
     * 1. BookingApprovals for this user's bookings (FK → booking_id NOT NULL)
     * 2. Nullify BookingApproval.reviewedBy (nullable — keep approval record,
     * remove reviewer ref)
     * 3. Nullify MaintenanceSchedule.createdBy (nullable — keep schedule, remove
     * creator ref)
     * 4. Reviews by this user (FK → user_id NOT NULL)
     * 5. WaitlistEntries by this user (FK → user_id NOT NULL)
     * 6. Notifications owned by this user (FK → user_id NOT NULL) ← the one that
     * was failing
     * 7. Bookings made by this user (FK → user_id NOT NULL)
     * 8. User ✓ no dependants remain
     */
    @Transactional
    public void deleteUser(Long id) {
        getUserById(id); // 404 fast-fail

        bookingApprovalRepository.deleteAllByBookingUserId(id); // 1
        bookingApprovalRepository.nullifyReviewedBy(id); // 2
        maintenanceRepository.nullifyCreatedBy(id); // 3
        reviewRepository.deleteAllByUserId(id); // 4
        waitlistRepository.deleteAllByUserId(id); // 5
        notificationRepository.deleteAllByUserId(id); // 6
        bookingRepository.deleteAllByUserId(id); // 7
        userRepository.deleteById(id); // 8
    }
}
