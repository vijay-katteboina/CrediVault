package com.credivault.repository;

import com.credivault.entity.Credential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CredentialRepository extends JpaRepository<Credential, Long> {

    Optional<Credential> findByCredentialCode(String credentialCode);

    List<Credential> findByStudentStudentId(Long studentId);

    long countByInstitution_InstitutionId(Long institutionId);
}