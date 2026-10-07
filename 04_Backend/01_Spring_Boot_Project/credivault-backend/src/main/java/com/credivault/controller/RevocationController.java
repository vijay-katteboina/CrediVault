package com.credivault.controller;

import com.credivault.dto.RevocationRequest;
import com.credivault.dto.RevocationResponse;
import com.credivault.service.RevocationService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/revocation")
public class RevocationController {

    private final RevocationService revocationService;

    public RevocationController(
            RevocationService revocationService) {

        this.revocationService = revocationService;
    }

    @PostMapping
    public ResponseEntity<RevocationResponse> revokeCredential(
            @Valid @RequestBody RevocationRequest request,
            Authentication authentication) {

        String issuerEmail =
                authentication.getName();

        RevocationResponse response =
                revocationService.revokeCredential(
                        request,
                        issuerEmail
                );

        return ResponseEntity.ok(response);
    }
}