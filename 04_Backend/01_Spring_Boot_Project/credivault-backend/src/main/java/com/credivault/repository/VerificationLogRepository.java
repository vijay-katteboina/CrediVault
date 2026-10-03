package com.credivault.repository;

import com.credivault.entity.VerificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationLogRepository
        extends JpaRepository<VerificationLog, Long> {
}