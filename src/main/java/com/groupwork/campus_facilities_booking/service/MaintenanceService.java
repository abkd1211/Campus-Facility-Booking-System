package com.groupwork.campus_facilities_booking.service;

import com.groupwork.campus_facilities_booking.model.Entities.Facility;
import com.groupwork.campus_facilities_booking.model.Entities.MaintenanceSchedule;
import com.groupwork.campus_facilities_booking.model.Entities.User;
import com.groupwork.campus_facilities_booking.repository.FacilityRepository;
import com.groupwork.campus_facilities_booking.repository.MaintenanceRepository;
import com.groupwork.campus_facilities_booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final FacilityRepository    facilityRepository;
    private final UserRepository        userRepository;

    // ── Get all maintenance schedules ─────────────────────────
    public List<MaintenanceSchedule> getAllSchedules() {
        return maintenanceRepository.findAll();
    }

    // ── Get single schedule ───────────────────────────────────
    public MaintenanceSchedule getScheduleById(Long id) {
        return maintenanceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Maintenance schedule not found with id: " + id));
    }

    // ── Get schedules for a specific facility ─────────────────
    public List<MaintenanceSchedule> getSchedulesByFacility(Long facilityId) {
        Facility facility = facilityRepository.findById(facilityId)
            .orElseThrow(() -> new RuntimeException("Facility not found with id: " + facilityId));
        return maintenanceRepository.findByFacility(facility);
    }

    // ── Get currently active maintenance blocks ───────────────
    // (today's date falls within startDate–endDate)
    public List<MaintenanceSchedule> getActiveSchedules() {
        LocalDate today = LocalDate.now();
        return maintenanceRepository.findActiveOnDate(today);
    }

    // ── Create maintenance schedule ───────────────────────────
    @Transactional
    public MaintenanceSchedule createSchedule(MaintenanceSchedule schedule) {
        Facility facility = facilityRepository.findById(schedule.getFacility().getId())
            .orElseThrow(() -> new RuntimeException("Facility not found"));

        if (schedule.getEndDate().isBefore(schedule.getStartDate())) {
            throw new RuntimeException("End date must be on or after start date.");
        }

        User admin = getCurrentUser();

        schedule.setFacility(facility);
        schedule.setCreatedBy(admin);

        return maintenanceRepository.save(schedule);
    }

    // ── Update maintenance schedule ───────────────────────────
    @Transactional
    public MaintenanceSchedule updateSchedule(Long id, MaintenanceSchedule updated) {
        MaintenanceSchedule existing = getScheduleById(id);

        if (updated.getEndDate().isBefore(updated.getStartDate())) {
            throw new RuntimeException("End date must be on or after start date.");
        }

        existing.setStartDate(updated.getStartDate());
        existing.setEndDate(updated.getEndDate());
        existing.setReason(updated.getReason());

        return maintenanceRepository.save(existing);
    }

    // ── Delete maintenance schedule ───────────────────────────
    @Transactional
    public void deleteSchedule(Long id) {
        MaintenanceSchedule schedule = getScheduleById(id);
        maintenanceRepository.delete(schedule);
    }

    // ── Helper ────────────────────────────────────────────────
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }
}
