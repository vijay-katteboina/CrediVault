package com.credivault.controller;

import com.credivault.dto.IssuerProfileResponse;
import com.credivault.service.IssuerProfileService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/issuer/profile")
@PreAuthorize("hasRole('ISSUER')")
public class IssuerProfileController {

    private final IssuerProfileService issuerProfileService;

    public IssuerProfileController(
            IssuerProfileService issuerProfileService) {
        this.issuerProfileService = issuerProfileService;
    }

    @GetMapping
    public ResponseEntity<IssuerProfileResponse> getProfile(
            Authentication authentication) {

        return ResponseEntity.ok(
                issuerProfileService.getIssuerProfile(
                        authentication.getName()
                )
        );
    }
}