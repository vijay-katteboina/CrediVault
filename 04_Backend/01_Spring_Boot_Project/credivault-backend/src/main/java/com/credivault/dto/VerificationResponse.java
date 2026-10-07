package com.credivault.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class VerificationResponse {

    private String credentialCode;

    private String result;

    private boolean integrityValid;

    private boolean signatureValid;

    private boolean revoked;

    private String credentialStatus;

    private Long studentId;

    private String studentNumber;

    private String course;

    private String academicYear;

    private Long institutionId;

    private String institutionName;

    private String institutionCode;

    private String credentialType;

    private Map<String, Object> credentialData;

    private String dataHash;

    private LocalDateTime issuedAt;

    private LocalDateTime verificationTime;

    public VerificationResponse() {
    }

    public String getCredentialCode() {
        return credentialCode;
    }

    public void setCredentialCode(String credentialCode) {
        this.credentialCode = credentialCode;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public boolean isIntegrityValid() {
        return integrityValid;
    }

    public void setIntegrityValid(boolean integrityValid) {
        this.integrityValid = integrityValid;
    }

    public boolean isSignatureValid() {
        return signatureValid;
    }

    public void setSignatureValid(boolean signatureValid) {
        this.signatureValid = signatureValid;
    }

    public boolean isRevoked() {
        return revoked;
    }

    public void setRevoked(boolean revoked) {
        this.revoked = revoked;
    }

    public String getCredentialStatus() {
        return credentialStatus;
    }

    public void setCredentialStatus(String credentialStatus) {
        this.credentialStatus = credentialStatus;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public void setStudentNumber(String studentNumber) {
        this.studentNumber = studentNumber;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public Long getInstitutionId() {
        return institutionId;
    }

    public void setInstitutionId(Long institutionId) {
        this.institutionId = institutionId;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public void setInstitutionName(String institutionName) {
        this.institutionName = institutionName;
    }

    public String getInstitutionCode() {
        return institutionCode;
    }

    public void setInstitutionCode(String institutionCode) {
        this.institutionCode = institutionCode;
    }

    public String getCredentialType() {
        return credentialType;
    }

    public void setCredentialType(String credentialType) {
        this.credentialType = credentialType;
    }

    public Map<String, Object> getCredentialData() {
        return credentialData;
    }

    public void setCredentialData(Map<String, Object> credentialData) {
        this.credentialData = credentialData;
    }

    public String getDataHash() {
        return dataHash;
    }

    public void setDataHash(String dataHash) {
        this.dataHash = dataHash;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(LocalDateTime issuedAt) {
        this.issuedAt = issuedAt;
    }

    public LocalDateTime getVerificationTime() {
        return verificationTime;
    }

    public void setVerificationTime(LocalDateTime verificationTime) {
        this.verificationTime = verificationTime;
    }
}