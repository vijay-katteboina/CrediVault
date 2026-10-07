package com.credivault.dto;

import java.time.LocalDateTime;

public class RevocationResponse {

    private Long revocationId;

    private Long credentialId;

    private String credentialCode;

    private String status;

    private String reason;

    private Long revokedBy;

    private LocalDateTime revokedAt;

    public RevocationResponse() {
    }

    public Long getRevocationId() {
        return revocationId;
    }

    public void setRevocationId(Long revocationId) {
        this.revocationId = revocationId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Long getRevokedBy() {
        return revokedBy;
    }

    public void setRevokedBy(Long revokedBy) {
        this.revokedBy = revokedBy;
    }

    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(LocalDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }
}