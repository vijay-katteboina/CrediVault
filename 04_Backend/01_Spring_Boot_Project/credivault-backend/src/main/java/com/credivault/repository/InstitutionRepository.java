package com.credivault.repository;

import com.credivault.entity.Institution;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface InstitutionRepository extends
        JpaRepository<Institution, Long>,
        JpaSpecificationExecutor<Institution> {

    Optional<Institution> findByInstitutionCode(String institutionCode);

    boolean existsByInstitutionCodeIgnoreCase(String institutionCode);
}