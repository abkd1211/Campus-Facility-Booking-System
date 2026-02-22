package com.groupwork.campus_facilities_booking.service;

import com.groupwork.campus_facilities_booking.model.Entities.Department;
import com.groupwork.campus_facilities_booking.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    // ── Get all departments ───────────────────────────────────
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    // ── Get single department ─────────────────────────────────
    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
    }

    // ── Get departments within a college ──────────────────────
    public List<Department> getDepartmentsByCollege(String collegeName) {
        return departmentRepository.findByCollegeIgnoreCase(collegeName);
    }

    // ── Create department ─────────────────────────────────────
    @Transactional
    public Department createDepartment(Department department) {
        if (departmentRepository.existsByNameIgnoreCase(department.getName())) {
            throw new RuntimeException(
                "A department named '" + department.getName() + "' already exists.");
        }
        return departmentRepository.save(department);
    }

    // ── Update department ─────────────────────────────────────
    @Transactional
    public Department updateDepartment(Long id, Department updated) {
        Department existing = getDepartmentById(id);
        existing.setName(updated.getName());
        existing.setCollege(updated.getCollege());
        existing.setHodName(updated.getHodName());
        existing.setHodEmail(updated.getHodEmail());
        return departmentRepository.save(existing);
    }

    // ── Delete department ─────────────────────────────────────
    @Transactional
    public void deleteDepartment(Long id) {
        Department department = getDepartmentById(id);
        departmentRepository.delete(department);
    }
}
