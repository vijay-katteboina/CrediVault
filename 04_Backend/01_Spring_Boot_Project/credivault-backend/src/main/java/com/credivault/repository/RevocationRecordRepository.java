package com.credivault.repository;

import com.credivault.entity.RevocationRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RevocationRecordRepository
        extends JpaRepository<RevocationRecord, Long> {
}