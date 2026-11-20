package com.credivault.dto;

import java.time.LocalDateTime;

public class AdminInstitutionResponse {

    private Long institutionId;
    private String institutionName;
    private String institutionCode;
    private String status;
    private LocalDateTime createdAt;

    private long totalIssuers;
    private long totalStudents;
    private long totalCredentials;

    public AdminInstitutionResponse(
            Long institutionId,
            String institutionName,
            String institutionCode,
            String status,
            LocalDateTime createdAt,
            long totalIssuers,
            long totalStudents,
            long totalCredentials) {

        this.institutionId = institutionId;
        this.institutionName = institutionName;
        this.institutionCode = institutionCode;
        this.status = status;
        this.createdAt = createdAt;
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