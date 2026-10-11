package com.credivault.repository;

import com.credivault.entity.VerificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VerificationLogRepository
        extends JpaRepository<VerificationLog, Long> {

    List<VerificationLog> findByVerifier_EmailOrderByVerificationTimeDesc(
            String verifierEmail
    );
}