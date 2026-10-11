package com.credivault.service;

import com.credivault.dto.WalletCredentialResponse;
import com.credivault.dto.WalletResponse;
import com.credivault.entity.Credential;
import com.credivault.entity.Student;
import com.credivault.repository.CredentialRepository;
import com.credivault.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final CredentialRepository credentialRepository;

    public StudentService(
            StudentRepository studentRepository,
            CredentialRepository credentialRepository) {

        this.studentRepository = studentRepository;
        this.credentialRepository = credentialRepository;
    }

    @Transactional(readOnly = true)
    public WalletResponse getWallet(String email) {

        Student student = studentRepository.findByUserEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Student profile not found for user: " + email
                        )
                );

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