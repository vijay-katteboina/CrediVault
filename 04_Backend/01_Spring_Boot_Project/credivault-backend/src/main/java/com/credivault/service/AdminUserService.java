package com.credivault.service;

import com.credivault.dto.AdminUserResponse;
import com.credivault.dto.AdminUserStatusRequest;
import com.credivault.entity.Institution;
import com.credivault.entity.User;
import com.credivault.repository.UserRepository;

import jakarta.transaction.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;

import org.springframework.security.core.Authentication;

import org.springframework.stereotype.Service;

import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class AdminUserService {

    private static final Set<String> ALLOWED_ROLES =
            Set.of("ADMIN", "STUDENT", "ISSUER", "VERIFIER");

    private static final Set<String> ALLOWED_STATUSES =
            Set.of("ACTIVE", "INACTIVE");

    private final UserRepository userRepository;
    private final UserService userService;
    private final AuditService auditService;

    public AdminUserService(
            UserRepository userRepository,
            UserService userService,
            AuditService auditService) {

        this.userRepository = userRepository;
        this.userService = userService;
        this.auditService = auditService;
    }

    // =========================================
    // 1. GET USERS WITH SEARCH AND FILTERS
    // =========================================

    @Transactional
    public Page<AdminUserResponse> getUsers(
            String search,
            String role,
            String status,
            int page,
            int size,
            Authentication authentication) {

        User admin = getActiveAdmin(authentication.getName());

        String normalizedRole =
                normalizeFilter(role, ALLOWED_ROLES, "role");

        String normalizedStatus =
                normalizeFilter(status, ALLOWED_STATUSES, "status");

        String normalizedSearch =
                search == null || search.isBlank()
                        ? null
                        : search.trim();

        if (normalizedSearch != null &&
                normalizedSearch.length() > 100) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Search must not exceed 100 characters"
            );
        }

        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid pagination parameters"
            );
        }

        Specification<User> specification =
                (root, query, builder) -> {

                    List<jakarta.persistence.criteria.Predicate>
                            predicates = new ArrayList<>();

                    if (normalizedSearch != null) {

                        String pattern =
                                "%" + normalizedSearch.toLowerCase(
                                        Locale.ROOT
                                ) + "%";

                        predicates.add(
                                builder.or(
                                        builder.like(
                                                builder.lower(
                                                        root.get("fullName")
                                                ),
                                                pattern
                                        ),
                                        builder.like(
                                                builder.lower(
                                                        root.get("email")
                                                ),
                                                pattern
                                        )
                                )
                        );
                    }

                    if (normalizedRole != null) {
                        predicates.add(
                                builder.equal(
                                        builder.upper(root.get("role")),
                                        normalizedRole
                                )
                        );
                    }

                    if (normalizedStatus != null) {
                        predicates.add(
                                builder.equal(
                                        builder.upper(
                                                root.get("accountStatus")
                                        ),
                                        normalizedStatus
                                )
                        );
                    }

                    return builder.and(
                            predicates.toArray(
                                    new jakarta.persistence.criteria.Predicate[0]
                            )
                    );
                };

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Order.desc("createdAt"),
                        Sort.Order.desc("userId")
                )
        );

        return userRepository.findAll(specification, pageable)
                .map(this::toResponse);
    }

    // =========================================
    // 2. GET USER DETAILS
    // =========================================

    @Transactional
    public AdminUserResponse getUser(
            Long userId,
            Authentication authentication) {

        getActiveAdmin(authentication.getName());

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        )
                );

        return toResponse(user);
    }

    // =========================================
    // 3. ACTIVATE / DEACTIVATE USER
    // =========================================

    @Transactional
    public AdminUserResponse changeUserStatus(
            Long userId,
            AdminUserStatusRequest request,
            Authentication authentication) {

        User admin = getActiveAdmin(authentication.getName());

        String newStatus = normalizeFilter(
                request.getAccountStatus(),
                ALLOWED_STATUSES,
                "account status"
        );

        User target = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        )
                );

        // Prevent an administrator from deactivating themselves.
        if (target.getUserId().equals(admin.getUserId())
                && "INACTIVE".equals(newStatus)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot deactivate your own administrator account"
            );
        }

        String oldStatus = target.getAccountStatus();

        // Avoid duplicate audit events for unchanged status.
        if (oldStatus.equalsIgnoreCase(newStatus)) {
            return toResponse(target);
        }

        // Protect the last active administrator.
        if ("ADMIN".equalsIgnoreCase(target.getRole())
                && "ACTIVE".equalsIgnoreCase(oldStatus)
                && "INACTIVE".equals(newStatus)) {

            long activeAdmins =
                    userRepository
                            .countByRoleIgnoreCaseAndAccountStatusIgnoreCase(
                                    "ADMIN",
                                    "ACTIVE"
                            );

            if (activeAdmins <= 1) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "The last active administrator cannot be deactivated"
                );
            }
        }

        target.setAccountStatus(newStatus);

        User savedUser = userRepository.save(target);

        String action = "ACTIVE".equals(newStatus)
                ? "ACTIVATE_USER"
                : "DEACTIVATE_USER";

        auditService.record(
                admin,
                action,
                "USER",
                String.valueOf(savedUser.getUserId()),
                "Account status changed from "
                        + oldStatus + " to " + newStatus
                        + " for " + savedUser.getEmail()
        );

        return toResponse(savedUser);
    }

    // =========================================
    // 4. ADMINISTRATOR AUTHORIZATION
    // =========================================

    private User getActiveAdmin(String email) {

        User admin = userService.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Administrator account not found"
                        )
                );

        if (!"ADMIN".equalsIgnoreCase(admin.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrator access required"
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(admin.getAccountStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrator account is inactive"
            );
        }

        return admin;
    }

    // =========================================
    // 5. FILTER VALIDATION
    // =========================================

    private String normalizeFilter(
            String value,
            Set<String> allowed,
            String fieldName) {

        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized =
                value.trim().toUpperCase(Locale.ROOT);

        if (!allowed.contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid " + fieldName
            );
        }

        return normalized;
    }

    // =========================================
    // 6. ENTITY TO RESPONSE DTO
    // =========================================

    private AdminUserResponse toResponse(User user) {

        Institution institution = user.getInstitution();

        return new AdminUserResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getAccountStatus(),
                institution == null
                        ? null
                        : institution.getInstitutionId(),
                institution == null
                        ? null
                        : institution.getInstitutionName(),
                institution == null
                        ? null
                        : institution.getInstitutionCode(),
                user.getCreatedAt()
        );
    }
}