package com.credivault.service;

import com.credivault.dto.AdminIssuerPasswordResetResponse;
import com.credivault.dto.AdminIssuerRegistrationRequest;
import com.credivault.dto.AdminIssuerRegistrationResponse;
import com.credivault.dto.AdminIssuerResponse;
import com.credivault.dto.AdminIssuerStatusRequest;
import com.credivault.entity.Institution;
import com.credivault.entity.User;
import com.credivault.exception.EmailAlreadyRegisteredException;
import com.credivault.repository.InstitutionRepository;
import com.credivault.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

@Service
public class AdminIssuerService {

    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AdminIssuerService(
            UserRepository userRepository,
            InstitutionRepository institutionRepository,
            UserService userService,
            PasswordEncoder passwordEncoder,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.institutionRepository = institutionRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional
    public AdminIssuerRegistrationResponse registerIssuer(
            AdminIssuerRegistrationRequest request,
            Authentication authentication) {

        User admin = getActiveAdmin(authentication.getName());

        String email =
                request.getEmail().trim()
                        .toLowerCase(Locale.ROOT);

        if (userRepository.findByEmail(email).isPresent()) {
            throw new EmailAlreadyRegisteredException(
                    "Email already registered"
            );
        }

        Institution institution =
                institutionRepository.findById(request.getInstitutionId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Institution not found"
                                )
                        );

        if (!"ACTIVE".equalsIgnoreCase(institution.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Institution must be ACTIVE"
            );
        }

        boolean generateTemporaryPassword =
                request.getInitialPassword() == null
                        || request.getInitialPassword().isBlank();

        String rawPassword = generateTemporaryPassword
                ? generateTemporaryPassword()
                : request.getInitialPassword();

        User issuer = new User();
        issuer.setFullName(request.getFullName().trim());
        issuer.setEmail(email);
        issuer.setPasswordHash(passwordEncoder.encode(rawPassword));
        issuer.setRole("ISSUER");
        issuer.setAccountStatus("ACTIVE");
        issuer.setInstitution(institution);
        issuer.setTokenVersion(0);
        issuer.setMustChangePassword(generateTemporaryPassword);
        issuer.setCreatedAt(LocalDateTime.now());

        User savedIssuer = userRepository.save(issuer);

        auditService.record(
                admin,
                "REGISTER_ISSUER",
                "USER",
                String.valueOf(savedIssuer.getUserId()),
                "Registered issuer "
                        + savedIssuer.getEmail()
                        + " for institution "
                        + institution.getInstitutionName()
        );

        return new AdminIssuerRegistrationResponse(
                toResponse(savedIssuer),
                generateTemporaryPassword ? rawPassword : null
        );
    }

    @Transactional
    public Page<AdminIssuerResponse> getIssuers(
            String search,
            Long institutionId,
            String status,
            int page,
            int size,
            Authentication authentication) {

        getActiveAdmin(authentication.getName());

        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid pagination parameters"
            );
        }

        String normalizedSearch =
                search == null || search.isBlank()
                        ? null
                        : search.trim();
        String normalizedStatus =
                status == null || status.isBlank()
                        ? null
                        : status.trim().toUpperCase(Locale.ROOT);

        if (normalizedStatus != null
                && !"ACTIVE".equals(normalizedStatus)
                && !"INACTIVE".equals(normalizedStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be ACTIVE or INACTIVE"
            );
        }

        Specification<User> specification =
                (root, query, builder) -> {
                    List<jakarta.persistence.criteria.Predicate>
                            predicates = new ArrayList<>();

                    predicates.add(
                            builder.equal(
                                    builder.upper(root.get("role")),
                                    "ISSUER"
                            )
                    );

                    if (normalizedSearch != null) {
                        String pattern =
                                "%" + normalizedSearch
                                        .toLowerCase(Locale.ROOT)
                                        + "%";
                        predicates.add(
                                builder.or(
                                        builder.like(
                                                builder.lower(root.get("fullName")),
                                                pattern
                                        ),
                                        builder.like(
                                                builder.lower(root.get("email")),
                                                pattern
                                        )
                                )
                        );
                    }

                    if (institutionId != null) {
                        predicates.add(
                                builder.equal(
                                        root.get("institution").get("institutionId"),
                                        institutionId
                                )
                        );
                    }

                    if (normalizedStatus != null) {
                        predicates.add(
                                builder.equal(
                                        builder.upper(root.get("accountStatus")),
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

    @Transactional
    public AdminIssuerResponse getIssuer(
            Long userId,
            Authentication authentication) {
        getActiveAdmin(authentication.getName());
        return toResponse(findIssuer(userId));
    }

    @Transactional
    public AdminIssuerResponse changeStatus(
            Long userId,
            AdminIssuerStatusRequest request,
            Authentication authentication) {

        User admin = getActiveAdmin(authentication.getName());
        User issuer = findIssuer(userId);

        String newStatus =
                request.getAccountStatus().trim()
                        .toUpperCase(Locale.ROOT);

        if (issuer.getAccountStatus().equalsIgnoreCase(newStatus)) {
            return toResponse(issuer);
        }

        issuer.setAccountStatus(newStatus);

        if ("INACTIVE".equals(newStatus)) {
            issuer.setTokenVersion(
                    (issuer.getTokenVersion() == null
                            ? 0
                            : issuer.getTokenVersion()) + 1
            );
        }

        User savedIssuer = userRepository.save(issuer);

        auditService.record(
                admin,
                "ACTIVE".equals(newStatus)
                        ? "ACTIVATE_ISSUER"
                        : "DEACTIVATE_ISSUER",
                "USER",
                String.valueOf(savedIssuer.getUserId()),
                "Changed issuer "
                        + savedIssuer.getEmail()
                        + " account status to "
                        + newStatus
        );

        return toResponse(savedIssuer);
    }

    @Transactional
    public AdminIssuerPasswordResetResponse resetPassword(
            Long userId,
            Authentication authentication) {

        User admin = getActiveAdmin(authentication.getName());
        User issuer = findIssuer(userId);

        String temporaryPassword =
                generateTemporaryPassword();

        issuer.setPasswordHash(
                passwordEncoder.encode(temporaryPassword)
        );
        issuer.setTokenVersion(
                (issuer.getTokenVersion() == null
                        ? 0
                        : issuer.getTokenVersion()) + 1
        );
        issuer.setMustChangePassword(true);
        User savedIssuer = userRepository.save(issuer);

        auditService.record(
                admin,
                "RESET_ISSUER_PASSWORD",
                "USER",
                String.valueOf(savedIssuer.getUserId()),
                "Reset password for issuer "
                        + savedIssuer.getEmail()
        );

        return new AdminIssuerPasswordResetResponse(
                savedIssuer.getUserId(),
                temporaryPassword
        );
    }

    private User findIssuer(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Issuer not found"
                        )
                );

        if (!"ISSUER".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Issuer not found"
            );
        }

        return user;
    }

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

    private String generateTemporaryPassword() {
        byte[] bytes = new byte[18];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private AdminIssuerResponse toResponse(User issuer) {
        Institution institution = issuer.getInstitution();
        return new AdminIssuerResponse(
                issuer.getUserId(),
                issuer.getFullName(),
                issuer.getEmail(),
                issuer.getRole(),
                issuer.getAccountStatus(),
                institution == null ? null : institution.getInstitutionId(),
                institution == null ? null : institution.getInstitutionName(),
                institution == null ? null : institution.getInstitutionCode(),
                issuer.getCreatedAt()
        );
    }
}
