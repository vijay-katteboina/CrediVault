package com.credivault.repository;

import com.credivault.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByStudentNumber(String studentNumber);

    Optional<Student> findByUserEmail(String email);

    List<Student>
    findByInstitution_InstitutionIdOrderByUser_FullNameAsc(
            Long institutionId
    );
}