package com.credivault.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
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
import java.util.Objects;
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
     * Only an active issuer assigned to the student's
     * institution can issue that student's credential.
     *
     * @param request credential information
     * @param issuerEmail authenticated issuer email
     * @return saved credential response
     */
    @Transactional
    public CredentialResponse issueCredential(
            CredentialRequest request,
            String issuerEmail) {

        // 1. Find the authenticated issuer.
        User issuer = userService
                .findByEmail(issuerEmail)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated issuer not found"
                        )
                );

        // 2. Verify the issuer's role.
        if (!"ISSUER".equalsIgnoreCase(issuer.getRole())) {
            throw new IllegalStateException(
                    "Only ISSUER users can issue credentials"
            );
        }

        // 3. Verify that the issuer account is active.
        if (!"ACTIVE".equalsIgnoreCase(
                issuer.getAccountStatus())) {

            throw new IllegalStateException(
                    "Issuer account is not active"
            );
        }

        // 4. Find the institution assigned to the issuer.
        Institution issuerInstitution =
                issuer.getInstitution();

        if (issuerInstitution == null) {
            throw new IllegalStateException(
                    "Issuer is not associated with an institution"
            );
        }

        // 5. Verify that the issuer's institution is active.
        if (!"ACTIVE".equalsIgnoreCase(
                issuerInstitution.getStatus())) {

            throw new IllegalStateException(
                    "Issuer's institution is not active"
            );
        }

        // 6. Find the requested student.
        Student student = studentRepository
                .findById(request.getStudentId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Student not found: "
                                        + request.getStudentId()
                        )
                );

        // 7. Get the institution associated with the student.
        Institution studentInstitution =
                student.getInstitution();

        if (studentInstitution == null) {
            throw new IllegalStateException(
                    "Student is not associated with an institution"
            );
        }

        // 8. Enforce institution-level authorization.
        // The issuer and student must belong to the same institution.
        if (!Objects.equals(
        issuerInstitution.getInstitutionId(),
        studentInstitution.getInstitutionId())) {

    throw new ResponseStatusException(
            HttpStatus.FORBIDDEN,
            "Issuer is not authorized to issue credentials "
                    + "for this student's institution"
    );
}

        // 9. Verify that the student's institution is active.
        if (!"ACTIVE".equalsIgnoreCase(
                studentInstitution.getStatus())) {

            throw new IllegalStateException(
                    "Institution is not active"
            );
        }

        /*
         * 10. Create deterministic JSON.
         *
         * Sort map entries to ensure that equivalent credential
         * data produces a consistent representation.
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

        // 11. Generate the SHA-256 integrity hash.
        String dataHash =
                hashService.sha256(canonicalData);

        // 12. Digitally sign the hash.
        String digitalSignature =
                digitalSignatureService.sign(dataHash);

        // 13. Generate a unique credential code.
        String credentialCode =
                "CV-"
                        + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 16)
                        .toUpperCase(Locale.ROOT);

        // 14. Create the credential entity.
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
                studentInstitution
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

        // 15. Save the credential.
        Credential savedCredential =
                credentialRepository.save(
                        credential
                );

        // 16. Record the audit event.
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

        // 17. Return the response DTO.
        return toResponse(savedCredential);
    }

    /**
     * Converts a Credential entity to CredentialResponse.
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