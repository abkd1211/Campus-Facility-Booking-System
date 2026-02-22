package com.groupwork.campus_facilities_booking.service;

import com.groupwork.campus_facilities_booking.model.Entities.FacilityType;
import com.groupwork.campus_facilities_booking.repository.FacilityTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityTypeService {

    private final FacilityTypeRepository facilityTypeRepository;

    // ── Get all types ─────────────────────────────────────────
    public List<FacilityType> getAllTypes() {
        return facilityTypeRepository.findAll();
    }

    // ── Get single type ───────────────────────────────────────
    public FacilityType getTypeById(Long id) {
        return facilityTypeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Facility type not found with id: " + id));
    }

    // ── Create type ───────────────────────────────────────────
    @Transactional
    public FacilityType createType(FacilityType facilityType) {
        if (facilityTypeRepository.existsByNameIgnoreCase(facilityType.getName())) {
            throw new RuntimeException(
                "A facility type named '" + facilityType.getName() + "' already exists.");
        }
        return facilityTypeRepository.save(facilityType);
    }

    // ── Update type ───────────────────────────────────────────
    @Transactional
    public FacilityType updateType(Long id, FacilityType updated) {
        FacilityType existing = getTypeById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setRequiresApproval(updated.getRequiresApproval());
        return facilityTypeRepository.save(existing);
    }

    // ── Delete type ───────────────────────────────────────────
    @Transactional
    public void deleteType(Long id) {
        FacilityType type = getTypeById(id);
        facilityTypeRepository.delete(type);
    }
}
