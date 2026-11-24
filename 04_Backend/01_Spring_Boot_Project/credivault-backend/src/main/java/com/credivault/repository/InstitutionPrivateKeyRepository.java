package com.credivault.repository;

import com.credivault.entity.InstitutionPrivateKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InstitutionPrivateKeyRepository
        extends JpaRepository<InstitutionPrivateKey, Long> {

    Optional<InstitutionPrivateKey> findByInstitutionInstitutionId(
            Long institutionId
    );
}
