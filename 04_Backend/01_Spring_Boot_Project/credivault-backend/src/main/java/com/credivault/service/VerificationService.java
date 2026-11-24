package com.credivault.service;

import com.credivault.dto.VerificationRequest;
import com.credivault.dto.VerificationResponse;
import com.credivault.dto.PublicVerificationResponse;

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

    /*
     * AUTHENTICATED VERIFICATION
     *
     * Used by authorized Verifier accounts.
     * Preserves the existing detailed response.
     */
    @Transactional
    public VerificationResponse verifyCredential(
            VerificationRequest request,
            String verifierEmail,
            String verificationIp) {

        if (verifierEmail == null || verifierEmail.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Verifier authentication is required"
            );
        }

        User verifier = validateVerifier(verifierEmail);

        VerificationOutcome outcome = performVerification(
                request,
                verifier,
                verificationIp
        );

        return toResponse(outcome);
    }

    /*
     * PUBLIC VERIFICATION
     *
     * Used by visitors without login.
     * Returns limited public information.
     */
    @Transactional
    public PublicVerificationResponse verifyPublicCredential(
            VerificationRequest request,
            String verificationIp) {

        VerificationOutcome outcome = performVerification(
                request,
                null,
                verificationIp
        );

        return toPublicResponse(outcome);
    }

    /*
     * VALIDATE AUTHENTICATED VERIFIER
     */
    private User validateVerifier(String verifierEmail) {

        User verifier = userService
                .findByEmail(verifierEmail)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Authenticated verifier not found"
                        )
                );

        if (!"VERIFIER".equalsIgnoreCase(verifier.getRole())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only VERIFIER users can access verifier operations"
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(
                verifier.getAccountStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Verifier account is not active"
            );
        }

        return verifier;
    }

    /*
     * SHARED VERIFICATION ENGINE
     *
     * Both public and authenticated verification
     * use exactly the same cryptographic checks.
     */
    private VerificationOutcome performVerification(
            VerificationRequest request,
            User verifier,
            String verificationIp) {

        /*
         * 1. Find credential.
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
         * 2. Get issuing institution.
         */
        Institution institution =
                credential.getInstitution();

        if (institution == null) {

            throw new IllegalStateException(
                    "Credential has no issuing institution"
            );
        }

        /*
         * 3. Re-create canonical JSON.
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
         * 4. Recalculate SHA-256.
         */
        String recalculatedHash =
                hashService.sha256(canonicalData);

        /*
         * 5. Check data integrity.
         */
        boolean integrityValid =
                recalculatedHash.equals(
                        credential.getDataHash()
                );

        /*
         * 6. Verify digital signature.
         */
        boolean signatureValid =
                digitalSignatureService.verify(
                        credential.getDataHash(),
                        credential.getDigitalSignature(),
                        institution.getPublicKey()
                );

        /*
         * 7. Check revocation.
         */
        boolean revoked =
                revocationRecordRepository
                        .findByCredentialCredentialId(
                                credential.getCredentialId()
                        )
                        .isPresent();

        /*
         * 8. Determine result.
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
         * 9. Save verification log.
         *
         * Authenticated verification:
         * verifier = authenticated User
         *
         * Public verification:
         * verifier = null
         */
        LocalDateTime verificationTime =
                LocalDateTime.now();

        VerificationLog verificationLog =
                new VerificationLog();

        verificationLog.setCredential(credential);
        verificationLog.setVerifier(verifier);
        verificationLog.setResult(result);
        verificationLog.setVerificationTime(verificationTime);
        verificationLog.setVerificationIp(verificationIp);

        verificationLogRepository.save(verificationLog);

        return new VerificationOutcome(
                credential,
                result,
                integrityValid,
                signatureValid,
                revoked,
                verificationTime
        );
    }

    /*
     * BUILD AUTHENTICATED RESPONSE
     */
    private VerificationResponse toResponse(
            VerificationOutcome outcome) {

        Credential credential = outcome.credential;

        Student student = credential.getStudent();
        Institution institution = credential.getInstitution();

        VerificationResponse response =
                new VerificationResponse();

        response.setCredentialCode(
                credential.getCredentialCode()
        );

        response.setResult(outcome.result);
        response.setIntegrityValid(outcome.integrityValid);
        response.setSignatureValid(outcome.signatureValid);
        response.setRevoked(outcome.revoked);

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
                outcome.verificationTime
        );

        return response;
    }

    /*
     * BUILD LIMITED PUBLIC RESPONSE
     */
    private PublicVerificationResponse toPublicResponse(
            VerificationOutcome outcome) {

        Credential credential = outcome.credential;

        Student student = credential.getStudent();
        Institution institution = credential.getInstitution();

        PublicVerificationResponse response =
                new PublicVerificationResponse();

        response.setCredentialCode(
                credential.getCredentialCode()
        );

        response.setResult(outcome.result);
        response.setIntegrityValid(outcome.integrityValid);
        response.setSignatureValid(outcome.signatureValid);
        response.setRevoked(outcome.revoked);

        response.setCredentialStatus(
                credential.getStatus()
        );

        // Student information
        response.setStudentName(
                student.getUser().getFullName()
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

        response.setInstitutionName(
                institution.getInstitutionName()
        );

        response.setInstitutionCode(
                institution.getInstitutionCode()
        );

        response.setCredentialType(
                credential.getCredentialType()
        );

        response.setIssuedAt(
                credential.getIssuedAt()
        );

        response.setVerificationTime(
                outcome.verificationTime
        );

        return response;
    }

    /*
     * INTERNAL VERIFICATION RESULT
     */
    private static class VerificationOutcome {

        private final Credential credential;
        private final String result;
        private final boolean integrityValid;
        private final boolean signatureValid;
        private final boolean revoked;
        private final LocalDateTime verificationTime;

        private VerificationOutcome(
                Credential credential,
                String result,
                boolean integrityValid,
                boolean signatureValid,
                boolean revoked,
                LocalDateTime verificationTime) {

            this.credential = credential;
            this.result = result;
            this.integrityValid = integrityValid;
            this.signatureValid = signatureValid;
            this.revoked = revoked;
            this.verificationTime = verificationTime;
        }
    }
}