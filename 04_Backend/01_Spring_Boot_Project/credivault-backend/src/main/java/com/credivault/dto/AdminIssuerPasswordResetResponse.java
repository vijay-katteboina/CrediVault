package com.credivault.dto;

public class AdminIssuerPasswordResetResponse {

    private Long userId;
    private String temporaryPassword;

    public AdminIssuerPasswordResetResponse(
            Long userId,
            String temporaryPassword) {
        this.userId = userId;
        this.temporaryPassword = temporaryPassword;
    }

    public Long getUserId() {
        return userId;
    }

    public String getTemporaryPassword() {
        return temporaryPassword;
    }
}
