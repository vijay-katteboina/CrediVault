package com.credivault.controller;

import com.credivault.dto.AdminAuditResponse;
import com.credivault.service.AdminAuditService;

import org.springframework.data.domain.Page;

import org.springframework.format.annotation.DateTimeFormat;

import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AdminAuditService adminAuditService;

    public AdminAuditController(
            AdminAuditService adminAuditService) {

        this.adminAuditService = adminAuditService;
    }

    // =========================================
    // LIST AUDIT RECORDS
    // =========================================

    @GetMapping
    public ResponseEntity<Page<AdminAuditResponse>> getAuditLogs(

            @RequestParam(required = false)
            String search,

            @RequestParam(required = false)
            String action,

            @RequestParam(required = false)
            String entityType,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "20")
            int size,

            Authentication authentication) {

        Page<AdminAuditResponse> response =
                adminAuditService.getAuditLogs(
                        search,
                        action,
                        entityType,
                        fromDate,
                        toDate,
                        page,
                        size,
                        authentication
                );

        return ResponseEntity.ok(response);
    }

    // =========================================
    // VIEW AUDIT RECORD DETAILS
    // =========================================

    @GetMapping("/{auditId}")
    public ResponseEntity<AdminAuditResponse> getAuditLog(

            @PathVariable Long auditId,

            Authentication authentication) {

        return ResponseEntity.ok(
                adminAuditService.getAuditLog(
                        auditId,
                        authentication
                )
        );
    }
}