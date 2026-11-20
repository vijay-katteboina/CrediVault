package com.credivault.service;

import com.credivault.dto.AdminAuditResponse;
import com.credivault.entity.AuditLog;
import com.credivault.entity.User;
import com.credivault.repository.AuditLogRepository;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.data.jpa.domain.Specification;

import org.springframework.http.HttpStatus;

import org.springframework.security.core.Authentication;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AdminAuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserService userService;

    public AdminAuditService(
            AuditLogRepository auditLogRepository,
            UserService userService) {

        this.auditLogRepository = auditLogRepository;
        this.userService = userService;
    }

    // =========================================
    // 1. GET AUDIT RECORDS WITH FILTERS
    // =========================================

    @Transactional(readOnly = true)
    public Page<AdminAuditResponse> getAuditLogs(
            String search,
            String action,
            String entityType,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size,
            Authentication authentication) {

        getActiveAdmin(authentication.getName());

        // Validate pagination.
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid pagination parameters"
            );
        }

        // Normalize search.
        String normalizedSearch =
                search == null || search.isBlank()
                        ? null
                        : search.trim();

        if (normalizedSearch != null
                && normalizedSearch.length() > 100) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Search must not exceed 100 characters"
            );
        }

        // Normalize action filter.
        String normalizedAction =
                normalizeFilter(action, 100, "action");

        // Normalize entity filter.
        String normalizedEntityType =
                normalizeFilter(entityType, 50, "entity type");

        // Validate date range.
        if (fromDate != null
                && toDate != null
                && fromDate.isAfter(toDate)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "From date cannot be after the to date"
            );
        }

        // Build dynamic query.
        Specification<AuditLog> specification =
                (root, query, builder) -> {

                    List<Predicate> predicates = new ArrayList<>();

                    // Search user and audit information.
                    if (normalizedSearch != null) {

                        String pattern =
                                "%"
                                + normalizedSearch.toLowerCase(Locale.ROOT)
                                + "%";

                        Join<AuditLog, User> userJoin =
                                root.join("user", JoinType.LEFT);

                        predicates.add(
                                builder.or(

                                        builder.like(
                                                builder.lower(
                                                        userJoin.get("fullName")
                                                ),
                                                pattern
                                        ),

                                        builder.like(
                                                builder.lower(
                                                        userJoin.get("email")
                                                ),
                                                pattern
                                        ),

                                        builder.like(
                                                builder.lower(
                                                        root.get("action")
                                                ),
                                                pattern
                                        ),

                                        builder.like(
                                                builder.lower(
                                                        root.get("entityType")
                                                ),
                                                pattern
                                        ),

                                        builder.like(
                                                builder.lower(
                                                        root.get("entityId")
                                                ),
                                                pattern
                                        ),

                                        builder.like(
                                                builder.lower(
                                                        root.get("details")
                                                ),
                                                pattern
                                        )
                                )
                        );
                    }

                    // Action filter.
                    if (normalizedAction != null) {

                        predicates.add(
                                builder.equal(
                                        builder.upper(root.get("action")),
                                        normalizedAction
                                )
                        );
                    }

                    // Entity type filter.
                    if (normalizedEntityType != null) {

                        predicates.add(
                                builder.equal(
                                        builder.upper(
                                                root.get("entityType")
                                        ),
                                        normalizedEntityType
                                )
                        );
                    }

                    // Starting date: inclusive.
                    if (fromDate != null) {

                        LocalDateTime startDate =
                                fromDate.atStartOfDay();

                        predicates.add(
                                builder.greaterThanOrEqualTo(
                                        root.<LocalDateTime>get("createdAt"),
                                        startDate
                                )
                        );
                    }

                    // Ending date: inclusive.
                    if (toDate != null) {

                        LocalDateTime endDate =
                                toDate.plusDays(1).atStartOfDay();

                        predicates.add(
                                builder.lessThan(
                                        root.<LocalDateTime>get("createdAt"),
                                        endDate
                                )
                        );
                    }

                    return builder.and(
                            predicates.toArray(new Predicate[0])
                    );
                };

        // Newest events appear first.
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Order.desc("createdAt"),
                        Sort.Order.desc("auditId")
                )
        );

        return auditLogRepository
                .findAll(specification, pageable)
                .map(this::toResponse);
    }

    // =========================================
    // 2. GET SINGLE AUDIT RECORD
    // =========================================

    @Transactional(readOnly = true)
    public AdminAuditResponse getAuditLog(
            Long auditId,
            Authentication authentication) {

        getActiveAdmin(authentication.getName());

        AuditLog auditLog =
                auditLogRepository.findById(auditId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Audit record not found"
                                )
                        );

        return toResponse(auditLog);
    }

    // =========================================
    // 3. ADMIN AUTHORIZATION
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
    // 4. NORMALIZE FILTERS
    // =========================================

    private String normalizeFilter(
            String value,
            int maximumLength,
            String fieldName) {

        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized =
                value.trim().toUpperCase(Locale.ROOT);

        if (normalized.length() > maximumLength) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " exceeds the maximum allowed length"
            );
        }

        return normalized;
    }

    // =========================================
    // 5. MAP ENTITY TO RESPONSE
    // =========================================

    private AdminAuditResponse toResponse(AuditLog auditLog) {

        User user = auditLog.getUser();

        return new AdminAuditResponse(
                auditLog.getAuditId(),
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                auditLog.getAction(),
                auditLog.getEntityType(),
                auditLog.getEntityId(),
                auditLog.getDetails(),
                auditLog.getCreatedAt()
        );
    }
}