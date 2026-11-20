package com.credivault.repository;

import com.credivault.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface UserRepository extends
        JpaRepository<User, Long>,
        JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    boolean existsByRoleIgnoreCase(String role);

    long countByRoleIgnoreCase(String role);

    long countByAccountStatusIgnoreCase(String accountStatus);

    long countByRoleIgnoreCaseAndAccountStatusIgnoreCase(
            String role,
            String accountStatus
    );

    long countByInstitution_InstitutionIdAndRoleIgnoreCase(
        Long institutionId,
        String role
);
}