package com.groupwork.campus_facilities_booking.service;

import com.groupwork.campus_facilities_booking.model.Entities.Facility;
import com.groupwork.campus_facilities_booking.model.Entities.FacilityType;
import com.groupwork.campus_facilities_booking.model.Entities.Department;
import com.groupwork.campus_facilities_booking.repository.FacilityRepository;
import com.groupwork.campus_facilities_booking.repository.FacilityTypeRepository;
import com.groupwork.campus_facilities_booking.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository    facilityRepository;
    private final FacilityTypeRepository facilityTypeRepository;
    private final DepartmentRepository  departmentRepository;
    private final BookingService        bookingService;

    // ── Get all facilities ────────────────────────────────────
    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    // ── Get single facility ───────────────────────────────────
    public Facility getFacilityById(Long id) {
        return facilityRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Facility not found with id: " + id));
    }

    // ── Get facilities by type ────────────────────────────────
    public List<Facility> getFacilitiesByType(Long typeId) {
        FacilityType type = facilityTypeRepository.findById(typeId)
            .orElseThrow(() -> new RuntimeException("Facility type not found with id: " + typeId));
        return facilityRepository.findByFacilityType(type);
    }

    // ── Get facilities by department ──────────────────────────
    public List<Facility> getFacilitiesByDepartment(Long deptId) {
        Department dept = departmentRepository.findById(deptId)
            .orElseThrow(() -> new RuntimeException("Department not found with id: " + deptId));
        return facilityRepository.findByOwningDepartment(dept);
    }

    // ── Search / filter facilities ────────────────────────────
    // Supports filtering by name, type, department, amenities, capacity
    public List<Facility> searchFacilities(
            String name, Long typeId, Long departmentId,
            Boolean hasProjector, Boolean hasAirConditioning,
            Boolean hasWifi, Boolean isOutdoor, Integer minCapacity) {

        return facilityRepository.findAll().stream()
            .filter(f -> name == null || f.getName().toLowerCase().contains(name.toLowerCase()))
            .filter(f -> typeId == null || f.getFacilityType().getId().equals(typeId))
            .filter(f -> departmentId == null ||
                (f.getOwningDepartment() != null && f.getOwningDepartment().getId().equals(departmentId)))
            .filter(f -> hasProjector == null || f.getHasProjector().equals(hasProjector))
            .filter(f -> hasAirConditioning == null || f.getHasAirConditioning().equals(hasAirConditioning))
            .filter(f -> hasWifi == null || f.getHasWifi().equals(hasWifi))
            .filter(f -> isOutdoor == null || f.getIsOutdoor().equals(isOutdoor))
            .filter(f -> minCapacity == null || f.getCapacity() >= minCapacity)
            .toList();
    }

    // ── Get availability slots (delegates to BookingService) ──
    public Map<String, Object> getAvailabilitySlots(Long facilityId, LocalDate date) {
        return bookingService.getAvailabilitySlots(facilityId, date);
    }

    // ── Create facility ───────────────────────────────────────
    @Transactional
    public Facility createFacility(Facility facility) {
        // Resolve facilityType
        if (facility.getFacilityType() != null && facility.getFacilityType().getId() != null) {
            FacilityType type = facilityTypeRepository.findById(facility.getFacilityType().getId())
                .orElseThrow(() -> new RuntimeException("Facility type not found"));
            facility.setFacilityType(type);
        }
        // Resolve owningDepartment if provided
        if (facility.getOwningDepartment() != null && facility.getOwningDepartment().getId() != null) {
            Department dept = departmentRepository.findById(facility.getOwningDepartment().getId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
            facility.setOwningDepartment(dept);
        }
        return facilityRepository.save(facility);
    }

    // ── Update facility ───────────────────────────────────────
    @Transactional
    public Facility updateFacility(Long id, Facility updated) {
        Facility existing = getFacilityById(id);

        existing.setName(updated.getName());
        existing.setLocation(updated.getLocation());
        existing.setCapacity(updated.getCapacity());
        existing.setHasProjector(updated.getHasProjector());
        existing.setHasAirConditioning(updated.getHasAirConditioning());
        existing.setHasWhiteboard(updated.getHasWhiteboard());
        existing.setHasPaSystem(updated.getHasPaSystem());
        existing.setHasVideoConferencing(updated.getHasVideoConferencing());
        existing.setHasWifi(updated.getHasWifi());
        existing.setIsOutdoor(updated.getIsOutdoor());
        existing.setIsWheelchairAccessible(updated.getIsWheelchairAccessible());
        existing.setOpeningTime(updated.getOpeningTime());
        existing.setClosingTime(updated.getClosingTime());
        existing.setImageUrl(updated.getImageUrl());
        existing.setRules(updated.getRules());

        if (updated.getFacilityType() != null && updated.getFacilityType().getId() != null) {
            FacilityType type = facilityTypeRepository.findById(updated.getFacilityType().getId())
                .orElseThrow(() -> new RuntimeException("Facility type not found"));
            existing.setFacilityType(type);
        }
        if (updated.getOwningDepartment() != null && updated.getOwningDepartment().getId() != null) {
            Department dept = departmentRepository.findById(updated.getOwningDepartment().getId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
            existing.setOwningDepartment(dept);
        }

        return facilityRepository.save(existing);
    }

    // ── Toggle availability (enable / disable) ────────────────
    @Transactional
    public Facility toggleAvailability(Long id) {
        Facility facility = getFacilityById(id);
        facility.setIsAvailable(!facility.getIsAvailable());
        return facilityRepository.save(facility);
    }

    // ── Delete facility ───────────────────────────────────────
    @Transactional
    public void deleteFacility(Long id) {
        Facility facility = getFacilityById(id);
        facilityRepository.delete(facility);
    }
}
