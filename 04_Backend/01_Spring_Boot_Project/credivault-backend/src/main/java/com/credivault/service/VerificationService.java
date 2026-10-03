package com.credivault.service;

import com.credivault.entity.Credential;
import com.credivault.repository.CredentialRepository;
import com.credivault.repository.RevocationRecordRepository;
import com.credivault.repository.VerificationLogRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class VerificationService {

    private final CredentialRepository credentialRepository;
    private final RevocationRecordRepository revocationRecordRepository;
    private final VerificationLogRepository verificationLogRepository;

    public VerificationService(
            CredentialRepository credentialRepository,
            RevocationRecordRepository revocationRecordRepository,
            VerificationLogRepository verificationLogRepository) {

        this.credentialRepository = credentialRepository;
        this.revocationRecordRepository = revocationRecordRepository;
        this.verificationLogRepository = verificationLogRepository;
    }

    public Optional<Credential> findCredential(String credentialCode) {
        return credentialRepository.findByCredentialCode(credentialCode);
    }

    public boolean isRevoked(Long credentialId) {
        return revocationRecordRepository
                .findByCredentialCredentialId(credentialId)
                .isPresent();
    }
}