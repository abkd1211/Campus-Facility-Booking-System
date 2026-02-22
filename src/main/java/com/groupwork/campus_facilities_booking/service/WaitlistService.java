package com.groupwork.campus_facilities_booking.service;

import com.groupwork.campus_facilities_booking.model.Entities.Facility;
import com.groupwork.campus_facilities_booking.model.Entities.User;
import com.groupwork.campus_facilities_booking.model.Entities.WaitlistEntry;
import com.groupwork.campus_facilities_booking.model.Enums.UserRole;
import com.groupwork.campus_facilities_booking.model.Enums.WaitlistStatus;
import com.groupwork.campus_facilities_booking.repository.FacilityRepository;
import com.groupwork.campus_facilities_booking.repository.UserRepository;
import com.groupwork.campus_facilities_booking.repository.WaitlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WaitlistService {

    private final WaitlistRepository waitlistRepository;
    private final FacilityRepository facilityRepository;
    private final UserRepository     userRepository;

    // ── Get all entries (Admin) ───────────────────────────────
    public List<WaitlistEntry> getAllEntries() {
        return waitlistRepository.findAll();
    }

    // ── Get current user's waitlist entries ───────────────────
    public List<WaitlistEntry> getEntriesForCurrentUser() {
        User user = getCurrentUser();
        return waitlistRepository.findByUserAndStatus(user, WaitlistStatus.WAITING);
    }

    // ── Get waitlist for a facility ───────────────────────────
    public List<WaitlistEntry> getEntriesByFacility(Long facilityId) {
        Facility facility = facilityRepository.findById(facilityId)
            .orElseThrow(() -> new RuntimeException("Facility not found with id: " + facilityId));
        return waitlistRepository.findByFacilityAndStatusOrderByPositionAsc(
            facility, WaitlistStatus.WAITING);
    }

    // ── Join waitlist ─────────────────────────────────────────
    @Transactional
    public WaitlistEntry joinWaitlist(WaitlistEntry entry) {
        Facility facility = facilityRepository.findById(entry.getFacility().getId())
            .orElseThrow(() -> new RuntimeException("Facility not found"));

        User user = getCurrentUser();

        // Check user isn't already on the waitlist for this slot
        boolean alreadyWaiting = waitlistRepository
            .existsByFacilityAndUserAndDateAndStartTime(
                facility, user, entry.getDate(), entry.getStartTime());
        if (alreadyWaiting) {
            throw new RuntimeException("You are already on the waitlist for this slot.");
        }

        // Determine queue position (next after last)
        int position = waitlistRepository
            .countByFacilityAndDateAndStartTimeAndStatus(
                facility, entry.getDate(), entry.getStartTime(), WaitlistStatus.WAITING) + 1;

        entry.setFacility(facility);
        entry.setUser(user);
        entry.setPosition(position);
        entry.setStatus(WaitlistStatus.WAITING);

        return waitlistRepository.save(entry);
    }

    // ── Leave waitlist ────────────────────────────────────────
    @Transactional
    public void leaveWaitlist(Long entryId) {
        WaitlistEntry entry = waitlistRepository.findById(entryId)
            .orElseThrow(() -> new RuntimeException("Waitlist entry not found with id: " + entryId));

        User currentUser = getCurrentUser();
        // Only allow the owner or an admin to remove an entry
        if (!entry.getUser().getId().equals(currentUser.getId()) &&
            currentUser.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("You are not authorised to remove this waitlist entry.");
        }

        int removedPosition = entry.getPosition();
        waitlistRepository.delete(entry);

        // Shift everyone behind this entry up by one position
        List<WaitlistEntry> behind = waitlistRepository
            .findByFacilityAndDateAndStartTimeAndStatusAndPositionGreaterThan(
                entry.getFacility(), entry.getDate(),
                entry.getStartTime(), WaitlistStatus.WAITING, removedPosition);

        for (WaitlistEntry e : behind) {
            e.setPosition(e.getPosition() - 1);
            waitlistRepository.save(e);
        }
    }

    // ── Helper ────────────────────────────────────────────────
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }
}
