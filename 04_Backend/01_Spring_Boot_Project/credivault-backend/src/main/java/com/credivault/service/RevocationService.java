package com.credivault.service;

import com.credivault.entity.RevocationRecord;
import com.credivault.repository.RevocationRecordRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RevocationService {

    private final RevocationRecordRepository revocationRecordRepository;

    public RevocationService(
            RevocationRecordRepository revocationRecordRepository) {
        this.revocationRecordRepository = revocationRecordRepository;
    }

    public Optional<RevocationRecord> findByCredentialId(Long credentialId) {
        return revocationRecordRepository
                .findByCredentialCredentialId(credentialId);
    }
}