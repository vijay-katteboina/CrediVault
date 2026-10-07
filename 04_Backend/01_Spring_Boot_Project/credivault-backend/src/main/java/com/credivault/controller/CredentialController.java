package com.credivault.controller;

import com.credivault.dto.CredentialRequest;
import com.credivault.dto.CredentialResponse;
import com.credivault.service.CredentialService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/issuer/credentials")
public class CredentialController {

    private final CredentialService credentialService;

    public CredentialController(
            CredentialService credentialService) {

        this.credentialService = credentialService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ISSUER')")
    public ResponseEntity<CredentialResponse> issueCredential(
            @Valid @RequestBody CredentialRequest request,
            Authentication authentication) {

        String issuerEmail =
                authentication.getName();

        CredentialResponse response =
                credentialService.issueCredential(
                        request,
                        issuerEmail
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}