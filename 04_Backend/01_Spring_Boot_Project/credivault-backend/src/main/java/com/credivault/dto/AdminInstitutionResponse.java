package com.credivault.dto;

import java.time.LocalDateTime;

public class AdminInstitutionResponse {

    private Long institutionId;
    private String institutionName;
    private String institutionCode;
    private String status;
    private LocalDateTime createdAt;

    // Institution certificate branding details
    private String institutionAddress;
    private String logoPath;
    private String signatoryName;
    private String signatoryDesignation;

    // Institution statistics
    private long totalIssuers;
    private long totalStudents;
    private long totalCredentials;

    public AdminInstitutionResponse(
            Long institutionId,
            String institutionName,
            String institutionCode,
            String status,
            LocalDateTime createdAt,
            String institutionAddress,
            String logoPath,
            String signatoryName,
            String signatoryDesignation,
            long totalIssuers,
            long totalStudents,
            long totalCredentials) {

        this.institutionId = institutionId;
        this.institutionName = institutionName;
        this.institutionCode = institutionCode;
        this.status = status;
        this.createdAt = createdAt;

        this.institutionAddress = institutionAddress;
        this.logoPath = logoPath;
        this.signatoryName = signatoryName;
        this.signatoryDesignation = signatoryDesignation;

        this.totalIssuers = totalIssuers;
        this.totalStudents = totalStudents;
        this.totalCredentials = totalCredentials;
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

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getInstitutionAddress() {
        return institutionAddress;
    }

    public String getLogoPath() {
        return logoPath;
    }

    public String getSignatoryName() {
        return signatoryName;
    }

    public String getSignatoryDesignation() {
        return signatoryDesignation;
    }

    public long getTotalIssuers() {
        return totalIssuers;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public long getTotalCredentials() {
        return totalCredentials;
    }
}