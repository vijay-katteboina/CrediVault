package com.credivault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RevocationRequest {

    @NotBlank
    private String credentialCode;

    @NotBlank
    @Size(max = 500)
    private String reason;

    public RevocationRequest() {
    }

    public String getCredentialCode() {
        return credentialCode;
    }

    public void setCredentialCode(String credentialCode) {
        this.credentialCode = credentialCode;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}