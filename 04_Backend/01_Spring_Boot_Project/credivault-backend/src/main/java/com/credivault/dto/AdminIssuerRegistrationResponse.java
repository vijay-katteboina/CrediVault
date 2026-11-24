package com.credivault.dto;

public class AdminIssuerRegistrationResponse {

    private AdminIssuerResponse issuer;
    private String temporaryPassword;

    public AdminIssuerRegistrationResponse(
            AdminIssuerResponse issuer,
            String temporaryPassword) {
        this.issuer = issuer;
        this.temporaryPassword = temporaryPassword;
    }

    public AdminIssuerResponse getIssuer() {
        return issuer;
    }

    public String getTemporaryPassword() {
        return temporaryPassword;
    }
}
