package com.credivault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.Map;

public class CredentialRequest {

    @NotNull
    @Positive
    private Long studentId;

    @NotBlank
    private String credentialType;

    @NotNull
    private Map<String, Object> credentialData;

    public CredentialRequest() {
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
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
}