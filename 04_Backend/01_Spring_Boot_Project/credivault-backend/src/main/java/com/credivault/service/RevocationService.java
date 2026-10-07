package com.credivault.service;

import com.credivault.dto.RevocationRequest;
import com.credivault.dto.RevocationResponse;
import com.credivault.entity.Credential;
import com.credivault.entity.RevocationRecord;
import com.credivault.entity.User;
import com.credivault.repository.CredentialRepository;
import com.credivault.repository.RevocationRecordRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class RevocationService {

    private final RevocationRecordRepository revocationRecordRepository;
    private final CredentialRepository credentialRepository;
    private final UserService userService;
    private final AuditService auditService;

    public RevocationService(
            RevocationRecordRepository revocationRecordRepository,
            CredentialRepository credentialRepository,
            UserService userService,
            AuditService auditService) {

        this.revocationRecordRepository = revocationRecordRepository;
        this.credentialRepository = credentialRepository;
        this.userService = userService;
        this.auditService = auditService;
    }

    public Optional<RevocationRecord> findByCredentialId(
            Long credentialId) {

        return revocationRecordRepository
                .findByCredentialCredentialId(credentialId);
    }

    @Transactional
    public RevocationResponse revokeCredential(
            RevocationRequest request,
            String issuerEmail) {

        /*
         * 1. Resolve authenticated issuer.
         */
        User issuer = userService
                .findByEmail(issuerEmail)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated issuer not found"
                        )
                );

        /*
         * 2. Verify issuer role.
         */
        if (!"ISSUER".equalsIgnoreCase(issuer.getRole())) {

            throw new IllegalStateException(
                    "Only ISSUER users can revoke credentials"
            );
        }

        /*
         * 3. Verify issuer account status.
         */
        if (!"ACTIVE".equalsIgnoreCase(
                issuer.getAccountStatus())) {

            throw new IllegalStateException(
                    "Issuer account is not active"
            );
        }

        /*
         * 4. Find credential.
         */
        Credential credential =
                credentialRepository
                        .findByCredentialCode(
                                request.getCredentialCode()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Credential not found: "
                                                + request
                                                .getCredentialCode()
                                )
                        );

        /*
         * 5. Prevent duplicate revocation.
         */
        if (revocationRecordRepository
                .findByCredentialCredentialId(
                        credential.getCredentialId()
                )
                .isPresent()) {

            throw new IllegalStateException(
                    "Credential is already revoked"
            );
        }

        /*
         * 6. Prevent revoking a credential that
         *    is already marked as revoked.
         */
        if ("REVOKED".equalsIgnoreCase(
                credential.getStatus())) {

            throw new IllegalStateException(
                    "Credential is already revoked"
            );
        }

        /*
         * 7. Update credential status.
         */
        LocalDateTime now =
                LocalDateTime.now();

        credential.setStatus("REVOKED");
        credential.setUpdatedAt(now);

        credentialRepository.save(credential);

        /*
         * 8. Create revocation record.
         */
        RevocationRecord revocationRecord =
                new RevocationRecord();

        revocationRecord.setCredential(
                credential
        );

        revocationRecord.setRevokedBy(
                issuer
        );

        revocationRecord.setReason(
                request.getReason()
        );

        revocationRecord.setRevokedAt(
                now
        );

        RevocationRecord savedRecord =
                revocationRecordRepository.save(
                        revocationRecord
                );

        /*
         * 9. Create audit record.
         */
        auditService.record(
                issuer,
                "REVOKE_CREDENTIAL",
                "CREDENTIAL",
                String.valueOf(
                        credential.getCredentialId()
                ),
                "Credential "
                        + credential.getCredentialCode()
                        + " revoked. Reason: "
                        + request.getReason()
        );

        /*
         * 10. Build response.
         */
        RevocationResponse response =
                new RevocationResponse();

        response.setRevocationId(
                savedRecord.getRevocationId()
        );

        response.setCredentialId(
                credential.getCredentialId()
        );

        response.setCredentialCode(
                credential.getCredentialCode()
        );

        response.setStatus(
                credential.getStatus()
        );

        response.setReason(
                savedRecord.getReason()
        );

        response.setRevokedBy(
                issuer.getUserId()
        );

        response.setRevokedAt(
                savedRecord.getRevokedAt()
        );

        return response;
    }
}