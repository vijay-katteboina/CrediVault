package com.credivault.controller;

import com.credivault.dto.VerificationRequest;
import com.credivault.dto.VerificationResponse;
import com.credivault.service.VerificationService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/verification")
public class VerificationController {

    private final VerificationService verificationService;

    public VerificationController(
            VerificationService verificationService) {

        this.verificationService = verificationService;
    }

    @PostMapping
    public ResponseEntity<VerificationResponse> verifyCredential(
            @Valid @RequestBody VerificationRequest request,
            org.springframework.security.core.Authentication authentication,
            HttpServletRequest httpRequest) {

        String verifierEmail =
                authentication.getName();

        String verificationIp =
                httpRequest.getRemoteAddr();

        VerificationResponse response =
                verificationService.verifyCredential(
                        request,
                        verifierEmail,
                        verificationIp
                );

        return ResponseEntity.ok(response);
    }
}