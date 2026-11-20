package com.credivault.controller;

import com.credivault.dto.AdminInstitutionResponse;
import com.credivault.dto.AdminInstitutionStatusRequest;

import com.credivault.service.AdminInstitutionService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;

import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/institutions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInstitutionController {

    private final AdminInstitutionService adminInstitutionService;

    public AdminInstitutionController(
            AdminInstitutionService adminInstitutionService) {

        this.adminInstitutionService = adminInstitutionService;
    }

    // LIST INSTITUTIONS
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

    // VIEW INSTITUTION DETAILS
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

    // ACTIVATE / DEACTIVATE INSTITUTION
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
}