package com.credivault.service;

import com.credivault.dto.AdminInstitutionResponse;
import com.credivault.dto.AdminInstitutionStatusRequest;
import com.credivault.dto.AdminInstitutionBrandingRequest;
import com.credivault.dto.AdminInstitutionRegistrationRequest;
import com.credivault.dto.AdminInstitutionRegistrationResponse;

import com.credivault.entity.Institution;
import com.credivault.entity.User;

import com.credivault.repository.InstitutionRepository;
import com.credivault.repository.UserRepository;
import com.credivault.repository.StudentRepository;
import com.credivault.repository.CredentialRepository;

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

import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Set;
import java.security.KeyPair;
import java.time.LocalDateTime;

@Service
public class AdminInstitutionService {

    private static final Set<String> ALLOWED_STATUSES =
            Set.of("ACTIVE", "INACTIVE");

    private final InstitutionRepository institutionRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final CredentialRepository credentialRepository;
    private final UserService userService;
    private final AuditService auditService;
    private final InstitutionLogoStorageService institutionLogoStorageService;
    private final InstitutionKeyService institutionKeyService;
    private final PasswordEncoder passwordEncoder;

    public AdminInstitutionService(
            InstitutionRepository institutionRepository,
            UserRepository userRepository,
            StudentRepository studentRepository,
            CredentialRepository credentialRepository,
            UserService userService,
            AuditService auditService,
            InstitutionLogoStorageService institutionLogoStorageService,
            InstitutionKeyService institutionKeyService,
            PasswordEncoder passwordEncoder) {

        this.institutionRepository = institutionRepository;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.credentialRepository = credentialRepository;
        this.userService = userService;
        this.auditService = auditService;
        this.institutionLogoStorageService = institutionLogoStorageService;
        this.institutionKeyService = institutionKeyService;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================================
    // REGISTER INSTITUTION
    // =========================================

    @Transactional
    public AdminInstitutionRegistrationResponse registerInstitution(
            AdminInstitutionRegistrationRequest request,
            Authentication authentication) {

        User admin = getActiveAdmin(authentication.getName());

        if (!institutionKeyService.isEncryptionKeyConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "University registration is unavailable: configure CREDIVAULT_KEY_MASTER_KEY and restart the backend"
            );
        }

        String institutionName =
                request.getInstitutionName().trim();
        String institutionCode =
                request.getInstitutionCode().trim()
                        .toUpperCase(Locale.ROOT);

        if (institutionRepository
                .existsByInstitutionCodeIgnoreCase(institutionCode)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Institution code is already registered"
            );
        }

        String loginEmail =
                request.getLoginEmail().trim()
                        .toLowerCase(Locale.ROOT);

        if (userRepository.findByEmail(loginEmail).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Login email is already registered"
            );
        }

        KeyPair keyPair =
                institutionKeyService.generateRsaKeyPair();

        LocalDateTime now = LocalDateTime.now();

        Institution institution = new Institution();
        institution.setInstitutionName(institutionName);
        institution.setInstitutionCode(institutionCode);
        institution.setPublicKey(
                InstitutionKeyService.encodePublicKey(
                        keyPair.getPublic()
                )
        );
        institution.setStatus("ACTIVE");
        institution.setCreatedAt(now);
        institution.setInstitutionAddress(
                blankToNull(request.getInstitutionAddress())
        );
        institution.setSignatoryName(
                blankToNull(request.getSignatoryName())
        );
        institution.setSignatoryDesignation(
                blankToNull(request.getSignatoryDesignation())
        );

        Institution savedInstitution =
                institutionRepository.save(institution);
        institutionRepository.flush();

        institutionKeyService.storeEncryptedPrivateKey(
                savedInstitution,
                keyPair.getPrivate(),
                now
        );

        User universityLogin = new User();
        universityLogin.setFullName(institutionName);
        universityLogin.setEmail(loginEmail);
        universityLogin.setPasswordHash(
                passwordEncoder.encode(request.getLoginPassword())
        );
        universityLogin.setRole("ISSUER");
        universityLogin.setAccountStatus("ACTIVE");
        universityLogin.setInstitution(savedInstitution);
        universityLogin.setTokenVersion(0);
        universityLogin.setMustChangePassword(false);
        universityLogin.setCreatedAt(now);

        User savedUniversityLogin =
                userRepository.save(universityLogin);

        auditService.record(
                admin,
                "REGISTER_INSTITUTION",
                "INSTITUTION",
                String.valueOf(savedInstitution.getInstitutionId()),
                "Registered institution "
                        + savedInstitution.getInstitutionName()
                        + " with institution code "
                        + savedInstitution.getInstitutionCode()
        );
        auditService.record(
                admin,
                "REGISTER_ISSUER",
                "USER",
                String.valueOf(savedUniversityLogin.getUserId()),
                "Created university login for "
                        + savedUniversityLogin.getEmail()
        );

        return new AdminInstitutionRegistrationResponse(
                toResponse(savedInstitution)
        );
    }

    // =========================================
    // 1. GET INSTITUTIONS WITH SEARCH/FILTERS
    // =========================================

    @Transactional
    public Page<AdminInstitutionResponse> getInstitutions(
            String search,
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

        if (normalizedSearch != null &&
                normalizedSearch.length() > 100) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Search must not exceed 100 characters"
            );
        }

        String normalizedStatus = normalizeStatus(status);

        Specification<Institution> specification =
                (root, query, builder) -> {

                    var predicates =
                            new java.util.ArrayList<
                                    jakarta.persistence.criteria.Predicate
                            >();

                    if (normalizedSearch != null) {

                        String pattern =
                                "%" + normalizedSearch.toLowerCase(
                                        Locale.ROOT
                                ) + "%";

                        predicates.add(
                                builder.or(
                                        builder.like(
                                                builder.lower(
                                                        root.get("institutionName")
                                                ),
                                                pattern
                                        ),
                                        builder.like(
                                                builder.lower(
                                                        root.get("institutionCode")
                                                ),
                                                pattern
                                        )
                                )
                        );
                    }

                    if (normalizedStatus != null) {

                        predicates.add(
                                builder.equal(
                                        builder.upper(root.get("status")),
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
                        Sort.Order.desc("institutionId")
                )
        );

        return institutionRepository
                .findAll(specification, pageable)
                .map(this::toResponse);
    }

    // =========================================
    // 2. GET INSTITUTION DETAILS
    // =========================================

    @Transactional
    public AdminInstitutionResponse getInstitution(
            Long institutionId,
            Authentication authentication) {

        getActiveAdmin(authentication.getName());

        Institution institution = findInstitution(institutionId);

        return toResponse(institution);
    }

    // =========================================
    // 3. CHANGE INSTITUTION STATUS
    // =========================================

    @Transactional
    public AdminInstitutionResponse changeInstitutionStatus(
            Long institutionId,
            AdminInstitutionStatusRequest request,
            Authentication authentication) {

        User admin = getActiveAdmin(authentication.getName());

        Institution institution = findInstitution(institutionId);

        String newStatus = normalizeStatus(request.getStatus());

        String oldStatus = institution.getStatus();

        if (oldStatus.equalsIgnoreCase(newStatus)) {
            return toResponse(institution);
        }

        institution.setStatus(newStatus);

        Institution savedInstitution =
                institutionRepository.save(institution);

        String action =
                "ACTIVE".equals(newStatus)
                        ? "ACTIVATE_INSTITUTION"
                        : "DEACTIVATE_INSTITUTION";

        auditService.record(
                admin,
                action,
                "INSTITUTION",
                String.valueOf(savedInstitution.getInstitutionId()),
                "Institution "
                        + savedInstitution.getInstitutionName()
                        + " status changed from "
                        + oldStatus
                        + " to "
                        + newStatus
        );

        return toResponse(savedInstitution);
    }

    // =========================================
    // 4. UPDATE INSTITUTION BRANDING
    // =========================================

    @Transactional
    public AdminInstitutionResponse updateInstitutionBranding(
            Long institutionId,
            AdminInstitutionBrandingRequest request,
            Authentication authentication) {

        User admin = getActiveAdmin(authentication.getName());

        Institution institution = findInstitution(institutionId);

        institution.setInstitutionAddress(
                request.getInstitutionAddress().trim()
        );

        institution.setSignatoryName(
                request.getSignatoryName().trim()
        );

        institution.setSignatoryDesignation(
                request.getSignatoryDesignation().trim()
        );

        Institution savedInstitution =
                institutionRepository.save(institution);

        auditService.record(
                admin,
                "UPDATE_INSTITUTION_BRANDING",
                "INSTITUTION",
                String.valueOf(savedInstitution.getInstitutionId()),
                "Updated certificate branding details for institution "
                        + savedInstitution.getInstitutionName()
        );

        return toResponse(savedInstitution);
    }

    // =========================================
    // 5. UPLOAD / REPLACE INSTITUTION LOGO
    // =========================================

    @Transactional
    public AdminInstitutionResponse uploadInstitutionLogo(
            Long institutionId,
            MultipartFile file,
            Authentication authentication) {

        User admin = getActiveAdmin(authentication.getName());

        Institution institution = findInstitution(institutionId);

        String oldLogoPath = institution.getLogoPath();

        String newLogoPath =
                institutionLogoStorageService.storeLogo(file);

        institution.setLogoPath(newLogoPath);

        Institution savedInstitution =
                institutionRepository.save(institution);

        auditService.record(
                admin,
                "UPLOAD_INSTITUTION_LOGO",
                "INSTITUTION",
                String.valueOf(savedInstitution.getInstitutionId()),
                "Uploaded or replaced institution logo for "
                        + savedInstitution.getInstitutionName()
                        + ". Previous logo: "
                        + (oldLogoPath == null ? "None" : "Existing logo")
        );

        return toResponse(savedInstitution);
    }

    // =========================================
    // 6. FIND INSTITUTION
    // =========================================

    private Institution findInstitution(Long institutionId) {

        return institutionRepository.findById(institutionId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Institution not found"
                        )
                );
    }

    // =========================================
    // 7. ADMINISTRATOR AUTHORIZATION
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
    // 8. STATUS VALIDATION
    // =========================================

    private String normalizeStatus(String status) {

        if (status == null || status.isBlank()) {
            return null;
        }

        String normalized =
                status.trim().toUpperCase(Locale.ROOT);

        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be ACTIVE or INACTIVE"
            );
        }

        return normalized;
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isEmpty()
                ? null
                : value.trim();
    }

    // =========================================
    // 9. ENTITY TO RESPONSE DTO
    // =========================================

    private AdminInstitutionResponse toResponse(
            Institution institution) {

        Long institutionId = institution.getInstitutionId();

        long totalIssuers =
                userRepository
                        .countByInstitution_InstitutionIdAndRoleIgnoreCase(
                                institutionId,
                                "ISSUER"
                        );

        long totalStudents =
                studentRepository
                        .countByInstitution_InstitutionId(institutionId);

        long totalCredentials =
                credentialRepository
                        .countByInstitution_InstitutionId(institutionId);

        return new AdminInstitutionResponse(
                institutionId,
                institution.getInstitutionName(),
                institution.getInstitutionCode(),
                institution.getStatus(),
                institution.getCreatedAt(),
                institution.getInstitutionAddress(),
                institution.getLogoPath(),
                institution.getSignatoryName(),
                institution.getSignatoryDesignation(),
                totalIssuers,
                totalStudents,
                totalCredentials
        );
    }
}