package com.credivault.controller;

import com.credivault.dto.AdminUserResponse;
import com.credivault.dto.AdminUserStatusRequest;
import com.credivault.dto.AdminUserInstitutionRequest;
import com.credivault.service.AdminUserService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;

import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(
            AdminUserService adminUserService) {

        this.adminUserService = adminUserService;
    }

    // GET ALL USERS
    @GetMapping
    public ResponseEntity<Page<AdminUserResponse>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        Page<AdminUserResponse> users =
                adminUserService.getUsers(
                        search,
                        role,
                        status,
                        page,
                        size,
                        authentication
                );

        return ResponseEntity.ok(users);
    }

    // GET USER DETAILS
    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserResponse> getUser(
            @PathVariable Long userId,
            Authentication authentication) {

        return ResponseEntity.ok(
                adminUserService.getUser(
                        userId,
                        authentication
                )
        );
    }

    // ACTIVATE / DEACTIVATE USER
    @PutMapping("/{userId}/status")
    public ResponseEntity<AdminUserResponse> changeStatus(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUserStatusRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                adminUserService.changeUserStatus(
                        userId,
                        request,
                        authentication
                )
        );
    }

    @PutMapping("/{userId}/institution")
    public ResponseEntity<AdminUserResponse> assignInstitution(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUserInstitutionRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                adminUserService.assignInstitution(
                        userId,
                        request,
                        authentication
                )
        );
    }
}