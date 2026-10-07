package com.credivault.dto;

import jakarta.validation.constraints.NotBlank;

public class VerificationRequest {

    @NotBlank
    private String credentialCode;

    public VerificationRequest() {
    }

    public String getCredentialCode() {
        return credentialCode;
    }

    public void setCredentialCode(String credentialCode) {
        this.credentialCode = credentialCode;
    }
}