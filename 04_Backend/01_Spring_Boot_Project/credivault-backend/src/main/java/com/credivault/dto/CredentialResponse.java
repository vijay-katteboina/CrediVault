package com.credivault.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class CredentialResponse {

    private Long credentialId;
    private String credentialCode;
    private String credentialType;
    private Map<String, Object> credentialData;
    private String dataHash;
    private String digitalSignature;
    private String status;
    private LocalDateTime issuedAt;
    private LocalDateTime updatedAt;

    public CredentialResponse() {
    }

    public Long getCredentialId() {
        return credentialId;
    }

    public void setCredentialId(Long credentialId) {
        this.credentialId = credentialId;
    }

    public String getCredentialCode() {
        return credentialCode;
    }

    public void setCredentialCode(String credentialCode) {
        this.credentialCode = credentialCode;
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

    public String getDigitalSignature() {
        return digitalSignature;
    }

    public void setDigitalSignature(String digitalSignature) {
        this.digitalSignature = digitalSignature;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(LocalDateTime issuedAt) {
        this.issuedAt = issuedAt;
    }

    public LocalDateTime getUpdatedAt() {
    return updatedAt;
}

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}