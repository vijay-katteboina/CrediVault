package com.credivault.service;

import com.credivault.dto.RevocationRequest;
import com.credivault.dto.RevocationResponse;
import com.credivault.entity.Credential;
import com.credivault.entity.Institution;
import com.credivault.entity.RevocationRecord;
import com.credivault.entity.User;
import com.credivault.repository.CredentialRepository;
import com.credivault.repository.RevocationRecordRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Objects;
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

    /**
     * Find a revocation record using the credential ID.
     */
    @Transactional(readOnly = true)
    public Optional<RevocationRecord> findByCredentialId(
            Long credentialId) {

        return revocationRecordRepository
                .findByCredentialCredentialId(credentialId);
    }

    /**
     * Revoke an active credential belonging to the issuer's institution.
     *
     * @param request     credential code and revocation reason
     * @param issuerEmail authenticated issuer email
     * @return revocation response
     */
    @Transactional
    public RevocationResponse revokeCredential(
            RevocationRequest request,
            String issuerEmail) {

        // 1. Resolve the authenticated issuer.
        User issuer = userService
                .findByEmail(issuerEmail)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Authenticated issuer was not found"
                        )
                );

        // 2. Only ISSUER accounts may revoke credentials.
        if (!"ISSUER".equalsIgnoreCase(issuer.getRole())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only ISSUER users can revoke credentials"
            );
        }

        // 3. The issuer account must be active.
        if (!"ACTIVE".equalsIgnoreCase(
                issuer.getAccountStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Issuer account is not active"
            );
        }

        // 4. Resolve the issuer's institution.
        Institution issuerInstitution =
                issuer.getInstitution();

        if (issuerInstitution == null
                || issuerInstitution.getInstitutionId() == null) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Issuer is not associated with an institution"
            );
        }

        // 5. The issuer's institution must be active.
        if (!"ACTIVE".equalsIgnoreCase(
                issuerInstitution.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Issuer institution is not active"
            );
        }

        // 6. Find the credential.
        Credential credential =
                credentialRepository
                        .findByCredentialCode(
                                request.getCredentialCode()
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Credential was not found"
                                )
                        );

        // 7. Resolve the credential's institution.
        Institution credentialInstitution =
                credential.getInstitution();

        if (credentialInstitution == null
                || credentialInstitution.getInstitutionId() == null) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Credential is not associated with an institution"
            );
        }

        /*
         * 8. Enforce institution-level authorization.
         *
         * Issuers may revoke credentials only when the credential
         * belongs to their own institution.
         */
        if (!Objects.equals(
                issuerInstitution.getInstitutionId(),
                credentialInstitution.getInstitutionId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Issuer is not authorized to revoke credentials "
                            + "for this institution"
            );
        }

        // 9. The credential's institution must also be active.
        if (!"ACTIVE".equalsIgnoreCase(
                credentialInstitution.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Credential institution is not active"
            );
        }

        // 10. Prevent duplicate revocation.
        boolean revocationAlreadyRecorded =
                revocationRecordRepository
                        .findByCredentialCredentialId(
                                credential.getCredentialId()
                        )
                        .isPresent();

        if (revocationAlreadyRecorded
                || "REVOKED".equalsIgnoreCase(
                        credential.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Credential is already revoked"
            );
        }

        // 11. Only ACTIVE credentials may be revoked.
        if (!"ACTIVE".equalsIgnoreCase(
                credential.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only active credentials can be revoked"
            );
        }

        // 12. Update the credential status.
        LocalDateTime now = LocalDateTime.now();

        credential.setStatus("REVOKED");
        credential.setUpdatedAt(now);

        credentialRepository.save(credential);

        // 13. Create the revocation record.
        RevocationRecord revocationRecord =
                new RevocationRecord();

        revocationRecord.setCredential(credential);
        revocationRecord.setRevokedBy(issuer);
        revocationRecord.setReason(request.getReason());
        revocationRecord.setRevokedAt(now);

        RevocationRecord savedRecord =
                revocationRecordRepository.save(
                        revocationRecord
                );

        // 14. Record the audit event.
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

        // 15. Build the response.
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