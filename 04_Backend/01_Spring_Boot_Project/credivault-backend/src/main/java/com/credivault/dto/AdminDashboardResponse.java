package com.credivault.dto;

public class AdminDashboardResponse {

    private long totalUsers;
    private long totalStudents;
    private long totalIssuers;
    private long totalInstitutions;
    private long activeAccounts;
    private long inactiveAccounts;
    private long totalAuditEvents;

    public AdminDashboardResponse(
            long totalUsers,
            long totalStudents,
            long totalIssuers,
            long totalInstitutions,
            long activeAccounts,
            long inactiveAccounts,
            long totalAuditEvents) {

        this.totalUsers = totalUsers;
        this.totalStudents = totalStudents;
        this.totalIssuers = totalIssuers;
        this.totalInstitutions = totalInstitutions;
        this.activeAccounts = activeAccounts;
        this.inactiveAccounts = inactiveAccounts;
        this.totalAuditEvents = totalAuditEvents;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public long getTotalIssuers() {
        return totalIssuers;
    }

    public long getTotalInstitutions() {
        return totalInstitutions;
    }

    public long getActiveAccounts() {
        return activeAccounts;
    }

    public long getInactiveAccounts() {
        return inactiveAccounts;
    }

    public long getTotalAuditEvents() {
        return totalAuditEvents;
    }
}