package com.credivault.controller;

import com.credivault.dto.AdminInstitutionResponse;
import com.credivault.dto.AdminInstitutionStatusRequest;
import com.credivault.dto.AdminInstitutionBrandingRequest;
import com.credivault.dto.AdminInstitutionRegistrationRequest;
import com.credivault.dto.AdminInstitutionRegistrationResponse;

import com.credivault.service.AdminInstitutionService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/institutions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInstitutionController {

    private final AdminInstitutionService adminInstitutionService;

    public AdminInstitutionController(
            AdminInstitutionService adminInstitutionService) {

        this.adminInstitutionService = adminInstitutionService;
    }

    // =========================================
    // 1. REGISTER INSTITUTION
    // =========================================

    @PostMapping
    public ResponseEntity<AdminInstitutionRegistrationResponse> registerInstitution(
            @Valid @RequestBody AdminInstitutionRegistrationRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                adminInstitutionService.registerInstitution(
                        request,
                        authentication
                )
        );
    }

    // =========================================
    // 2. LIST INSTITUTIONS
    // =========================================

    @GetMapping
    public ResponseEntity<Page<AdminInstitutionResponse>>
            getInstitutions(
                    @RequestParam(required = false) String search,
                    @RequestParam(required = false) String status,
                    @RequestParam(defaultValue = "0") int page,
                    @RequestParam(defaultValue = "20") int size,
                    Authentication authentication) {

        Page<AdminInstitutionResponse> response =
                adminInstitutionService.getInstitutions(
                        search,
                        status,
                        page,
                        size,
                        authentication
                );

        return ResponseEntity.ok(response);
    }

    // =========================================
    // 2. VIEW INSTITUTION DETAILS
    // =========================================

    @GetMapping("/{institutionId}")
    public ResponseEntity<AdminInstitutionResponse> getInstitution(
            @PathVariable Long institutionId,
            Authentication authentication) {

        return ResponseEntity.ok(
                adminInstitutionService.getInstitution(
                        institutionId,
                        authentication
                )
        );
    }

    // =========================================
    // 3. ACTIVATE / DEACTIVATE INSTITUTION
    // =========================================

    @PutMapping("/{institutionId}/status")
    public ResponseEntity<AdminInstitutionResponse> changeStatus(
            @PathVariable Long institutionId,
            @Valid @RequestBody AdminInstitutionStatusRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                adminInstitutionService.changeInstitutionStatus(
                        institutionId,
                        request,
                        authentication
                )
        );
    }

    // =========================================
    // 4. UPDATE INSTITUTION BRANDING
    // =========================================

    @PutMapping("/{institutionId}/branding")
    public ResponseEntity<AdminInstitutionResponse> updateBranding(
            @PathVariable Long institutionId,
            @Valid @RequestBody AdminInstitutionBrandingRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                adminInstitutionService.updateInstitutionBranding(
                        institutionId,
                        request,
                        authentication
                )
        );
    }

    // =========================================
    // 5. UPLOAD / REPLACE INSTITUTION LOGO
    // =========================================

    @PostMapping(
            value = "/{institutionId}/logo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<AdminInstitutionResponse> uploadLogo(
            @PathVariable Long institutionId,
            @RequestPart("file") MultipartFile file,
            Authentication authentication) {

        return ResponseEntity.ok(
                adminInstitutionService.uploadInstitutionLogo(
                        institutionId,
                        file,
                        authentication
                )
        );
    }
}