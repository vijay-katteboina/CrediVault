package com.credivault.service;

import com.credivault.dto.VerificationHistoryResponse;
import com.credivault.entity.Credential;
import com.credivault.entity.Institution;
import com.credivault.entity.Student;
import com.credivault.entity.VerificationLog;
import com.credivault.repository.VerificationLogRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VerifierHistoryService {

    private final VerificationLogRepository verificationLogRepository;

    public VerifierHistoryService(
            VerificationLogRepository verificationLogRepository) {

        this.verificationLogRepository = verificationLogRepository;
    }

    @Transactional(readOnly = true)
    public List<VerificationHistoryResponse> getHistory(
            String verifierEmail) {

        return verificationLogRepository
                .findByVerifier_EmailOrderByVerificationTimeDesc(
                        verifierEmail
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private VerificationHistoryResponse toResponse(
            VerificationLog verificationLog) {

        Credential credential = verificationLog.getCredential();

        Student student = credential.getStudent();

        Institution institution = credential.getInstitution();

        VerificationHistoryResponse response =
                new VerificationHistoryResponse();

        response.setVerificationId(
                verificationLog.getVerificationId()
        );

        response.setCredentialCode(
                credential.getCredentialCode()
        );

        response.setResult(
                verificationLog.getResult()
        );

        response.setVerificationTime(
                verificationLog.getVerificationTime()
        );

        response.setVerificationIp(
                verificationLog.getVerificationIp()
        );

        response.setStudentNumber(
                student.getStudentNumber()
        );

        response.setCredentialType(
                credential.getCredentialType()
        );

        response.setCredentialStatus(
                credential.getStatus()
        );

        response.setInstitutionName(
                institution != null
                        ? institution.getInstitutionName()
                        : null
        );

        return response;
    }
}