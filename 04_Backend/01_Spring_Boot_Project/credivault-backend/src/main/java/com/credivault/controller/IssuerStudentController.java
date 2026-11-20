package com.credivault.controller;

import com.credivault.dto.IssuerStudentCreateRequest;
import com.credivault.dto.IssuerStudentResponse;
import com.credivault.dto.IssuerStudentUpdateRequest;
import com.credivault.dto.StudentStatusRequest;
import com.credivault.service.IssuerStudentService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/issuer/students")
@PreAuthorize("hasRole('ISSUER')")
public class IssuerStudentController {

    private final IssuerStudentService issuerStudentService;

    public IssuerStudentController(
            IssuerStudentService issuerStudentService) {

        this.issuerStudentService = issuerStudentService;
    }

    // =========================================================
    // 1. GET ALL STUDENTS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<IssuerStudentResponse>> getStudents(
            Authentication authentication) {

        List<IssuerStudentResponse> students =
                issuerStudentService.getStudentsForIssuer(
                        authentication.getName()
                );

        return ResponseEntity.ok(students);
    }

    // =========================================================
    // 2. REGISTER A NEW STUDENT
    // =========================================================

    @PostMapping
    public ResponseEntity<IssuerStudentResponse> createStudent(
            @Valid @RequestBody IssuerStudentCreateRequest request,
            Authentication authentication) {

        IssuerStudentResponse response =
                issuerStudentService.createStudent(
                        request,
                        authentication.getName()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // =========================================================
    // 3. GET STUDENT BY ID
    // =========================================================

    @GetMapping("/{studentId}")
    public ResponseEntity<IssuerStudentResponse> getStudent(
            @PathVariable Long studentId,
            Authentication authentication) {

        IssuerStudentResponse response =
                issuerStudentService.getStudentForIssuer(
                        studentId,
                        authentication.getName()
                );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // 4. UPDATE STUDENT PROFILE
    // =========================================================

    @PutMapping("/{studentId}")
    public ResponseEntity<IssuerStudentResponse> updateStudent(
            @PathVariable Long studentId,
            @Valid @RequestBody IssuerStudentUpdateRequest request,
            Authentication authentication) {

        IssuerStudentResponse response =
                issuerStudentService.updateStudent(
                        studentId,
                        request,
                        authentication.getName()
                );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // 5. ACTIVATE / DEACTIVATE STUDENT
    // =========================================================

    @PatchMapping("/{studentId}/status")
    public ResponseEntity<IssuerStudentResponse> changeStudentStatus(
            @PathVariable Long studentId,
            @Valid @RequestBody StudentStatusRequest request,
            Authentication authentication) {

        IssuerStudentResponse response =
                issuerStudentService.changeStudentStatus(
                        studentId,
                        request.getAccountStatus(),
                        authentication.getName()
                );

        return ResponseEntity.ok(response);
    }
}