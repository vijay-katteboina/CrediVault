package com.credivault.service;

import com.credivault.dto.VerificationRequest;
import com.credivault.dto.VerificationResponse;
import com.credivault.entity.Credential;
import com.credivault.entity.Institution;
import com.credivault.entity.Student;
import com.credivault.entity.User;
import com.credivault.entity.VerificationLog;
import com.credivault.repository.CredentialRepository;
import com.credivault.repository.RevocationRecordRepository;
import com.credivault.repository.VerificationLogRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.SerializationFeature;

import java.time.LocalDateTime;

@Service
public class VerificationService {

    private final CredentialRepository credentialRepository;
    private final RevocationRecordRepository revocationRecordRepository;
    private final VerificationLogRepository verificationLogRepository;
    private final UserService userService;
    private final HashService hashService;
    private final DigitalSignatureService digitalSignatureService;
    private final ObjectMapper objectMapper;

    public VerificationService(
            CredentialRepository credentialRepository,
            RevocationRecordRepository revocationRecordRepository,
            VerificationLogRepository verificationLogRepository,
            UserService userService,
            HashService hashService,
            DigitalSignatureService digitalSignatureService,
            ObjectMapper objectMapper) {

        this.credentialRepository = credentialRepository;
        this.revocationRecordRepository = revocationRecordRepository;
        this.verificationLogRepository = verificationLogRepository;
        this.userService = userService;
        this.hashService = hashService;
        this.digitalSignatureService = digitalSignatureService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public VerificationResponse verifyCredential(
            VerificationRequest request,
            String verifierEmail,
            String verificationIp) {

        /*
         * 1. Find the authenticated verifier.
         */
        User verifier = userService
                .findByEmail(verifierEmail)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated verifier not found"
                        )
                );

        /*
         * 2. Verify verifier role.
         */
        if (!"VERIFIER".equalsIgnoreCase(verifier.getRole())) {

            throw new IllegalStateException(
                    "Only VERIFIER users can verify credentials"
            );
        }

        /*
         * 3. Verify verifier account status.
         */
        if (!"ACTIVE".equalsIgnoreCase(
                verifier.getAccountStatus())) {

            throw new IllegalStateException(
                    "Verifier account is not active"
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
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No credential found with the supplied credential code"
                                )
                        );

        /*
         * 5. Get institution.
         */
        Institution institution =
                credential.getInstitution();

        if (institution == null) {

            throw new IllegalStateException(
                    "Credential has no issuing institution"
            );
        }

        /*
         * 6. Re-create the exact canonical JSON representation
         *    that was used during credential issuance.
         */
        String canonicalData;

        try {

            canonicalData = objectMapper
                    .writer(
                            SerializationFeature
                                    .ORDER_MAP_ENTRIES_BY_KEYS
                    )
                    .writeValueAsString(
                            credential.getCredentialData()
                    );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Failed to serialize credential data",
                    e
            );
        }

        /*
         * 7. Recalculate SHA-256.
         */
        String recalculatedHash =
                hashService.sha256(canonicalData);

        /*
         * 8. Compare the stored hash with the recalculated hash.
         */
        boolean integrityValid =
                recalculatedHash.equals(
                        credential.getDataHash()
                );

        /*
         * 9. Verify the digital signature using the
         *    institution's public key.
         *
         *    During issuance, the dataHash was signed.
         */
        boolean signatureValid =
                digitalSignatureService.verify(
                        credential.getDataHash(),
                        credential.getDigitalSignature(),
                        institution.getPublicKey()
                );

        /*
         * 10. Check revocation record.
         */
        boolean revoked =
                revocationRecordRepository
                        .findByCredentialCredentialId(
                                credential.getCredentialId()
                        )
                        .isPresent();

        /*
         * 11. Determine verification result.
         */
        String result;

        if (!integrityValid) {

            result = "TAMPERED";

        } else if (!signatureValid) {

            result = "INVALID";

        } else if (revoked
                || "REVOKED".equalsIgnoreCase(
                        credential.getStatus())) {

            result = "REVOKED";

        } else if (!"ACTIVE".equalsIgnoreCase(
                credential.getStatus())) {

            result = "INVALID";

        } else {

            result = "VERIFIED";
        }

        /*
         * 12. Save verification log.
         */
        LocalDateTime verificationTime =
                LocalDateTime.now();

        VerificationLog verificationLog =
                new VerificationLog();

        verificationLog.setCredential(
                credential
        );

        verificationLog.setVerifier(
                verifier
        );

        verificationLog.setResult(
                result
        );

        verificationLog.setVerificationTime(
                verificationTime
        );

        verificationLog.setVerificationIp(
                verificationIp
        );

        verificationLogRepository.save(
                verificationLog
        );

        /*
         * 13. Build response.
         */
        return toResponse(
                credential,
                result,
                integrityValid,
                signatureValid,
                revoked,
                verificationTime
        );
    }

    private VerificationResponse toResponse(
            Credential credential,
            String result,
            boolean integrityValid,
            boolean signatureValid,
            boolean revoked,
            LocalDateTime verificationTime) {

        VerificationResponse response =
                new VerificationResponse();

        Student student =
                credential.getStudent();

        Institution institution =
                credential.getInstitution();

        response.setCredentialCode(
                credential.getCredentialCode()
        );

        response.setResult(
                result
        );

        response.setIntegrityValid(
                integrityValid
        );

        response.setSignatureValid(
                signatureValid
        );

        response.setRevoked(
                revoked
        );

        response.setCredentialStatus(
                credential.getStatus()
        );

        response.setStudentId(
                student.getStudentId()
        );

        response.setStudentNumber(
                student.getStudentNumber()
        );

        response.setCourse(
                student.getCourse()
        );

        response.setAcademicYear(
                student.getAcademicYear()
        );

        response.setInstitutionId(
                institution.getInstitutionId()
        );

        response.setInstitutionName(
                institution.getInstitutionName()
        );

        response.setInstitutionCode(
                institution.getInstitutionCode()
        );

        response.setCredentialType(
                credential.getCredentialType()
        );

        response.setCredentialData(
                credential.getCredentialData()
        );

        response.setDataHash(
                credential.getDataHash()
        );

        response.setIssuedAt(
                credential.getIssuedAt()
        );

        response.setVerificationTime(
                verificationTime
        );

        return response;
    }
}