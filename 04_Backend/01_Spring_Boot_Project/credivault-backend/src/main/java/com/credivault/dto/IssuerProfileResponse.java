package com.credivault.dto;

import java.time.LocalDateTime;

public class IssuerProfileResponse {

    private Long issuerId;
    private String fullName;
    private String email;
    private String role;
    private String accountStatus;
    private LocalDateTime createdAt;

    private Long institutionId;
    private String institutionName;
    private String institutionCode;
    private String institutionStatus;

    public IssuerProfileResponse(
            Long issuerId,
            String fullName,
            String email,
            String role,
            String accountStatus,
            LocalDateTime createdAt,
            Long institutionId,
            String institutionName,
            String institutionCode,
            String institutionStatus) {

        this.issuerId = issuerId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.accountStatus = accountStatus;
        this.createdAt = createdAt;
        this.institutionId = institutionId;
        this.institutionName = institutionName;
        this.institutionCode = institutionCode;
        this.institutionStatus = institutionStatus;
    }

    public Long getIssuerId() {
        return issuerId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getInstitutionId() {
        return institutionId;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public String getInstitutionCode() {
        return institutionCode;
    }

    public String getInstitutionStatus() {
        return institutionStatus;
    }
}