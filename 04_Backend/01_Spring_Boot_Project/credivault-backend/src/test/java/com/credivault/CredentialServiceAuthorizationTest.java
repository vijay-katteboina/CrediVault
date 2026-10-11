package com.credivault;

import com.credivault.dto.CredentialRequest;
import com.credivault.entity.Credential;
import com.credivault.entity.Institution;
import com.credivault.entity.Student;
import com.credivault.entity.User;
import com.credivault.repository.CredentialRepository;
import com.credivault.repository.StudentRepository;
import com.credivault.service.AuditService;
import com.credivault.service.CredentialService;
import com.credivault.service.DigitalSignatureService;
import com.credivault.service.HashService;
import com.credivault.service.UserService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class CredentialServiceAuthorizationTest {

    private CredentialRepository credentialRepository;
    private StudentRepository studentRepository;
    private UserService userService;
    private HashService hashService;
    private DigitalSignatureService digitalSignatureService;
    private AuditService auditService;
    private ObjectMapper objectMapper;

    private CredentialService credentialService;

    @BeforeEach
    void setUp() {

        // Mock dependencies so this test does not access the database.
        credentialRepository = mock(CredentialRepository.class);
        studentRepository = mock(StudentRepository.class);
        userService = mock(UserService.class);
        hashService = mock(HashService.class);
        digitalSignatureService =
                mock(DigitalSignatureService.class);
        auditService = mock(AuditService.class);
        objectMapper = mock(ObjectMapper.class);

        credentialService = new CredentialService(
                credentialRepository,
                studentRepository,
                userService,
                hashService,
                digitalSignatureService,
                auditService,
                objectMapper
        );
    }

    @Test
    void issuerCannotIssueCredentialToStudentFromAnotherInstitution() {

        // Institution assigned to the issuer.
        Institution issuerInstitution = new Institution();
        issuerInstitution.setInstitutionId(1L);
        issuerInstitution.setInstitutionName(
                "CrediVault Demo University"
        );
        issuerInstitution.setStatus("ACTIVE");

        // Authenticated issuer assigned to Institution 1.
        User issuer = new User();
        issuer.setUserId(3L);
        issuer.setEmail("issuer@credivault.com");
        issuer.setRole("ISSUER");
        issuer.setAccountStatus("ACTIVE");
        issuer.setInstitution(issuerInstitution);

        // Different institution assigned to the student.
        Institution studentInstitution = new Institution();
        studentInstitution.setInstitutionId(2L);
        studentInstitution.setInstitutionName(
                "Cross-Institution Test Institution"
        );
        studentInstitution.setStatus("ACTIVE");

        // Test student belongs to Institution 2.
        Student student = new Student();
        student.setStudentId(4L);
        student.setStudentNumber("CV-STU-SEC-001");
        student.setInstitution(studentInstitution);

        // Simulate the existing issuer and student records.
        when(userService.findByEmail("issuer@credivault.com"))
                .thenReturn(Optional.of(issuer));

        when(studentRepository.findById(4L))
                .thenReturn(Optional.of(student));

        // Prepare the issuance request.
        CredentialRequest request = new CredentialRequest();
        request.setStudentId(4L);
        request.setCredentialType("MCA Degree");
        request.setCredentialData(
                Map.of(
                        "studentName",
                        "Cross-Institution Test Student",
                        "course",
                        "MCA"
                )
        );

        // The authorization check must reject this request.
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> credentialService.issueCredential(
                        request,
                        "issuer@credivault.com"
                )
        );

        // Verify the expected HTTP status.
        assertEquals(
                HttpStatus.FORBIDDEN,
                exception.getStatusCode()
        );

        // No credential may be saved for the unauthorized student.
        verify(
                credentialRepository,
                never()
        ).save(any(Credential.class));

        // No hashing, signing, or audit event should occur.
        verifyNoInteractions(
                hashService,
                digitalSignatureService,
                auditService,
                objectMapper
        );
    }
}