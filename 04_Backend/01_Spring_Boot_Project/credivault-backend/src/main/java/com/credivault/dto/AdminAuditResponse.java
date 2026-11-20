package com.credivault.dto;

import java.time.LocalDateTime;

public class AdminAuditResponse {

    private Long auditId;

    private Long userId;
    private String userFullName;
    private String userEmail;
    private String userRole;

    private String action;
    private String entityType;
    private String entityId;
    private String details;

    private LocalDateTime createdAt;

    public AdminAuditResponse(
            Long auditId,
            Long userId,
            String userFullName,
            String userEmail,
            String userRole,
            String action,
            String entityType,
            String entityId,
            String details,
            LocalDateTime createdAt) {

        this.auditId = auditId;
        this.userId = userId;
        this.userFullName = userFullName;
        this.userEmail = userEmail;
        this.userRole = userRole;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.details = details;
        this.createdAt = createdAt;
    }

    public Long getAuditId() {
        return auditId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserFullName() {
        return userFullName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public String getUserRole() {
        return userRole;
    }

    public String getAction() {
        return action;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public String getDetails() {
        return details;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}