package com.credivault.controller;

import com.credivault.dto.VerificationRequest;
import com.credivault.dto.VerificationResponse;
import com.credivault.dto.PublicVerificationResponse;
import com.credivault.service.VerificationService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/verification")
public class VerificationController {

    private final VerificationService verificationService;

    public VerificationController(
            VerificationService verificationService) {
        this.verificationService = verificationService;
    }

    /*
     * PUBLIC CREDENTIAL VERIFICATION
     * No login required.
     */
    @PostMapping("/public")
    public ResponseEntity<PublicVerificationResponse> verifyPublicCredential(
            @Valid @RequestBody VerificationRequest request,
            HttpServletRequest httpRequest) {

        String verificationIp = httpRequest.getRemoteAddr();

        PublicVerificationResponse response =
                verificationService.verifyPublicCredential(
                        request,
                        verificationIp
                );

        return ResponseEntity.ok(response);
    }

    /*
     * AUTHENTICATED VERIFIER CREDENTIAL VERIFICATION
     */
    @PostMapping
    public ResponseEntity<VerificationResponse> verifyCredential(
            @Valid @RequestBody VerificationRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {

        String verifierEmail = authentication.getName();
        String verificationIp = httpRequest.getRemoteAddr();

        VerificationResponse response =
                verificationService.verifyCredential(
                        request,
                        verifierEmail,
                        verificationIp
                );

        return ResponseEntity.ok(response);
    }
}