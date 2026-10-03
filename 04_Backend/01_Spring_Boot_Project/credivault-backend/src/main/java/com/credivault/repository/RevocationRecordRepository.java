package com.credivault.repository;

import com.credivault.entity.RevocationRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RevocationRecordRepository
        extends JpaRepository<RevocationRecord, Long> {

    Optional<RevocationRecord> findByCredentialCredentialId(Long credentialId);
}