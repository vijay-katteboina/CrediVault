package com.credivault.controller;

import com.credivault.dto.IssuerStudentResponse;
import com.credivault.service.IssuerStudentService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/issuer/students")
public class IssuerStudentController {

    private final IssuerStudentService issuerStudentService;

    public IssuerStudentController(
            IssuerStudentService issuerStudentService) {

        this.issuerStudentService = issuerStudentService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ISSUER')")
    public ResponseEntity<List<IssuerStudentResponse>> getStudents(
            Authentication authentication) {

        List<IssuerStudentResponse> students =
                issuerStudentService.getStudentsForIssuer(
                        authentication.getName()
                );

        return ResponseEntity.ok(students);
    }
}