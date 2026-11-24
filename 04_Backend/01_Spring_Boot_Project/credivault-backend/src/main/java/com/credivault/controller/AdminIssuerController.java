package com.credivault.controller;

import com.credivault.dto.AdminIssuerPasswordResetResponse;
import com.credivault.dto.AdminIssuerRegistrationRequest;
import com.credivault.dto.AdminIssuerRegistrationResponse;
import com.credivault.dto.AdminIssuerResponse;
import com.credivault.dto.AdminIssuerStatusRequest;
import com.credivault.service.AdminIssuerService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/issuers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminIssuerController {

    private final AdminIssuerService adminIssuerService;

    public AdminIssuerController(AdminIssuerService adminIssuerService) {
        this.adminIssuerService = adminIssuerService;
    }

    @PostMapping
    public ResponseEntity<AdminIssuerRegistrationResponse> registerIssuer(
            @Valid @RequestBody AdminIssuerRegistrationRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                adminIssuerService.registerIssuer(request, authentication)
        );
    }

    @GetMapping
    public Page<AdminIssuerResponse> getIssuers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long institutionId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        return adminIssuerService.getIssuers(
                search,
                institutionId,
                status,
                page,
                size,
                authentication
        );
    }

    @GetMapping("/{userId}")
    public ResponseEntity<AdminIssuerResponse> getIssuer(
            @PathVariable Long userId,
            Authentication authentication) {
        return ResponseEntity.ok(
                adminIssuerService.getIssuer(userId, authentication)
        );
    }

    @PutMapping("/{userId}/status")
    public ResponseEntity<AdminIssuerResponse> changeStatus(
            @PathVariable Long userId,
            @Valid @RequestBody AdminIssuerStatusRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                adminIssuerService.changeStatus(
                        userId,
                        request,
                        authentication
                )
        );
    }

    @PutMapping("/{userId}/reset-password")
    public ResponseEntity<AdminIssuerPasswordResetResponse> resetPassword(
            @PathVariable Long userId,
            Authentication authentication) {
        return ResponseEntity.ok(
                adminIssuerService.resetPassword(
                        userId,
                        authentication
                )
        );
    }
}
