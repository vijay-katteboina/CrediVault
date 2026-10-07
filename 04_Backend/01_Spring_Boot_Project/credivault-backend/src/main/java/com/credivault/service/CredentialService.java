package com.credivault.service;

import com.credivault.dto.CredentialRequest;
import com.credivault.dto.CredentialResponse;
import com.credivault.entity.Credential;
import com.credivault.entity.Institution;
import com.credivault.entity.Student;
import com.credivault.entity.User;
import com.credivault.repository.CredentialRepository;
import com.credivault.repository.StudentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.SerializationFeature;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final StudentRepository studentRepository;
    private final UserService userService;
    private final HashService hashService;
    private final DigitalSignatureService digitalSignatureService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public CredentialService(
            CredentialRepository credentialRepository,
            StudentRepository studentRepository,
            UserService userService,
            HashService hashService,
            DigitalSignatureService digitalSignatureService,
            AuditService auditService,
            ObjectMapper objectMapper) {

        this.credentialRepository = credentialRepository;
        this.studentRepository = studentRepository;
        this.userService = userService;
        this.hashService = hashService;
        this.digitalSignatureService = digitalSignatureService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    /**
     * Find a credential using its unique credential code.
     */
    public Optional<Credential> findByCredentialCode(
            String credentialCode) {

        return credentialRepository
                .findByCredentialCode(credentialCode);
    }

    /**
     * Issues a new academic credential.
     *
     * @param request credential information
     * @param issuerEmail authenticated issuer email
     * @return saved credential response
     */
    @Transactional
    public CredentialResponse issueCredential(
            CredentialRequest request,
            String issuerEmail) {

        // 1. Find authenticated issuer.
        User issuer = userService
                .findByEmail(issuerEmail)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated issuer not found"
                        )
                );

        // 2. Verify issuer role.
        if (!"ISSUER".equalsIgnoreCase(issuer.getRole())) {
            throw new IllegalStateException(
                    "Only ISSUER users can issue credentials"
            );
        }

        // 3. Verify issuer account status.
        if (!"ACTIVE".equalsIgnoreCase(
                issuer.getAccountStatus())) {

            throw new IllegalStateException(
                    "Issuer account is not active"
            );
        }

        // 4. Find student.
        Student student = studentRepository
                .findById(request.getStudentId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Student not found: "
                                        + request.getStudentId()
                        )
                );

        // 5. Get institution associated with the student.
        Institution institution =
                student.getInstitution();

        if (institution == null) {
            throw new IllegalStateException(
                    "Student is not associated with an institution"
            );
        }

        // 6. Verify institution is active.
        if (!"ACTIVE".equalsIgnoreCase(
                institution.getStatus())) {

            throw new IllegalStateException(
                    "Institution is not active"
            );
        }

        /*
         * 7. Create deterministic JSON.
         *
         * Jackson 3 supports per-call serialization features
         * through ObjectMapper.writer(...).
         */
        String canonicalData;

        try {

            canonicalData = objectMapper
                    .writer(
                            SerializationFeature
                                    .ORDER_MAP_ENTRIES_BY_KEYS
                    )
                    .writeValueAsString(
                            request.getCredentialData()
                    );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Failed to serialize credential data",
                    e
            );
        }

        // 8. Generate SHA-256 integrity hash.
        String dataHash =
                hashService.sha256(canonicalData);

        // 9. Digitally sign the hash.
        String digitalSignature =
                digitalSignatureService.sign(dataHash);

        // 10. Generate unique credential code.
        String credentialCode =
                "CV-"
                        + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 16)
                        .toUpperCase(Locale.ROOT);

        // 11. Create credential entity.
        LocalDateTime now =
                LocalDateTime.now();

        Credential credential =
                new Credential();

        credential.setCredentialCode(
                credentialCode
        );

        credential.setStudent(
                student
        );

        credential.setInstitution(
                institution
        );

        credential.setCredentialType(
                request.getCredentialType()
        );

        credential.setCredentialData(
                request.getCredentialData()
        );

        credential.setDataHash(
                dataHash
        );

        credential.setDigitalSignature(
                digitalSignature
        );

        credential.setStatus(
                "ACTIVE"
        );

        credential.setIssuedAt(
                now
        );

        credential.setUpdatedAt(
                now
        );

        // 12. Save credential.
        Credential savedCredential =
                credentialRepository.save(
                        credential
                );

        // 13. Record audit event.
        auditService.record(
                issuer,
                "ISSUE_CREDENTIAL",
                "CREDENTIAL",
                String.valueOf(
                        savedCredential.getCredentialId()
                ),
                "Credential "
                        + savedCredential.getCredentialCode()
                        + " issued to student "
                        + student.getStudentNumber()
        );

        // 14. Return response DTO.
        return toResponse(savedCredential);
    }

    /**
     * Converts Credential entity to CredentialResponse.
     */
    private CredentialResponse toResponse(
            Credential credential) {

        CredentialResponse response =
                new CredentialResponse();

        Student student =
                credential.getStudent();

        Institution institution =
                credential.getInstitution();

        response.setCredentialId(
                credential.getCredentialId()
        );

        response.setCredentialCode(
                credential.getCredentialCode()
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

        response.setDigitalSignature(
                credential.getDigitalSignature()
        );

        response.setStatus(
                credential.getStatus()
        );

        response.setIssuedAt(
                credential.getIssuedAt()
        );

        response.setUpdatedAt(
                credential.getUpdatedAt()
        );

        return response;
    }
}