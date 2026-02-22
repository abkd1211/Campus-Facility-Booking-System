package com.groupwork.campus_facilities_booking.repository;

import com.groupwork.campus_facilities_booking.model.Entities.Department;
import com.groupwork.campus_facilities_booking.model.Entities.Facility;
import com.groupwork.campus_facilities_booking.model.Entities.FacilityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {

    List<Facility> findByFacilityType(FacilityType facilityType);

    List<Facility> findByOwningDepartment(Department department);

    List<Facility> findByIsAvailableTrue();

    List<Facility> findByNameContainingIgnoreCase(String name);
}
