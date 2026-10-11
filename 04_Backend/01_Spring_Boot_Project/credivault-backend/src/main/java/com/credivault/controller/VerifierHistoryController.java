package com.credivault.controller;

import com.credivault.dto.VerificationHistoryResponse;
import com.credivault.service.VerifierHistoryService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/verifier/history")
public class VerifierHistoryController {

    private final VerifierHistoryService verifierHistoryService;

    public VerifierHistoryController(
            VerifierHistoryService verifierHistoryService) {

        this.verifierHistoryService = verifierHistoryService;
    }

    @GetMapping
    @PreAuthorize("hasRole('VERIFIER')")
    public ResponseEntity<List<VerificationHistoryResponse>> getHistory(
            Authentication authentication) {

        String verifierEmail = authentication.getName();

        List<VerificationHistoryResponse> history =
                verifierHistoryService.getHistory(verifierEmail);

        return ResponseEntity.ok(history);
    }
}