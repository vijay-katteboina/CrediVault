package com.credivault.dto;

import java.time.LocalDateTime;

public class AdminIssuerResponse {

    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private String accountStatus;
    private Long institutionId;
    private String institutionName;
    private String institutionCode;
    private LocalDateTime createdAt;

    public AdminIssuerResponse(
            Long userId,
            String fullName,
            String email,
            String role,
            String accountStatus,
            Long institutionId,
            String institutionName,
            String institutionCode,
            LocalDateTime createdAt) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.accountStatus = accountStatus;
        this.institutionId = institutionId;
        this.institutionName = institutionName;
        this.institutionCode = institutionCode;
        this.createdAt = createdAt;
    }

    public Long getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getAccountStatus() { return accountStatus; }
    public Long getInstitutionId() { return institutionId; }
    public String getInstitutionName() { return institutionName; }
    public String getInstitutionCode() { return institutionCode; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
