package com.credivault.service;

import com.credivault.dto.WalletCredentialResponse;
import com.credivault.dto.WalletResponse;
import com.credivault.entity.Credential;
import com.credivault.entity.Student;
import com.credivault.repository.CredentialRepository;
import com.credivault.repository.StudentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final CredentialRepository credentialRepository;
    private final CertificatePdfService certificatePdfService;

    public StudentService(
            StudentRepository studentRepository,
            CredentialRepository credentialRepository,
            CertificatePdfService certificatePdfService) {

        this.studentRepository = studentRepository;
        this.credentialRepository = credentialRepository;
        this.certificatePdfService = certificatePdfService;
    }

    /**
     * Retrieves the authenticated student's wallet.
     */
    @Transactional(readOnly = true)
    public WalletResponse getWallet(String email) {

        Student student = findStudentByEmail(email);

        List<Credential> credentials =
                credentialRepository.findByStudentStudentId(
                        student.getStudentId()
                );

        List<WalletCredentialResponse> credentialResponses =
                credentials.stream()
                        .map(this::toWalletCredentialResponse)
                        .toList();

        WalletResponse response = new WalletResponse();

        response.setStudentId(student.getStudentId());
        response.setStudentNumber(student.getStudentNumber());

        response.setFullName(
                student.getUser().getFullName()
        );

        response.setEmail(
                student.getUser().getEmail()
        );

        response.setCourse(student.getCourse());
        response.setAcademicYear(student.getAcademicYear());

        response.setInstitutionName(
                student.getInstitution().getInstitutionName()
        );

        response.setCredentials(credentialResponses);

        return response;
    }

    /**
     * Generates a certificate after confirming that the credential
     * belongs to the authenticated student.
     *
     * The credential ID supplied by the client is never treated
     * as proof of ownership.
     */
    @Transactional(readOnly = true)
    public byte[] downloadCertificate(
            Long credentialId,
            String authenticatedEmail) {

        if (credentialId == null || credentialId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A valid credential ID is required"
            );
        }

        Student authenticatedStudent =
                findStudentByEmail(authenticatedEmail);

        Credential credential = credentialRepository
                .findById(credentialId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Credential not found"
                ));

        Long credentialStudentId =
                credential.getStudent() == null
                        ? null
                        : credential.getStudent().getStudentId();

        if (!Objects.equals(
                authenticatedStudent.getStudentId(),
                credentialStudentId)) {

            // Return 404 rather than disclose another student's credential.
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Credential not found"
            );
        }

        return certificatePdfService.generateCertificate(
                credential.getCredentialCode()
        );
    }

    private Student findStudentByEmail(String email) {

        return studentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Student profile not found"
                ));
    }

    private WalletCredentialResponse toWalletCredentialResponse(
            Credential credential) {

        WalletCredentialResponse response =
                new WalletCredentialResponse();

        response.setCredentialId(
                credential.getCredentialId()
        );

        response.setCredentialCode(
                credential.getCredentialCode()
        );

        response.setCredentialType(
                credential.getCredentialType()
        );

        response.setStatus(
                credential.getStatus()
        );

        response.setIssuedAt(
                credential.getIssuedAt()
        );

        return response;
    }
}
