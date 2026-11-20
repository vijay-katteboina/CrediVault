package com.credivault.service;

import com.credivault.dto.IssuerProfileResponse;
import com.credivault.entity.Institution;
import com.credivault.entity.User;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IssuerProfileService {

    private final UserService userService;

    public IssuerProfileService(UserService userService) {
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public IssuerProfileResponse getIssuerProfile(String email) {

        User issuer = userService.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Authenticated issuer not found"
                        )
                );

        if (!"ISSUER".equalsIgnoreCase(issuer.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Issuer access required"
            );
        }

        Institution institution = issuer.getInstitution();

        return new IssuerProfileResponse(
                issuer.getUserId(),
                issuer.getFullName(),
                issuer.getEmail(),
                issuer.getRole(),
                issuer.getAccountStatus(),
                issuer.getCreatedAt(),

                institution != null
                        ? institution.getInstitutionId() : null,

                institution != null
                        ? institution.getInstitutionName() : null,

                institution != null
                        ? institution.getInstitutionCode() : null,

                institution != null
                        ? institution.getStatus() : null
        );
    }
}