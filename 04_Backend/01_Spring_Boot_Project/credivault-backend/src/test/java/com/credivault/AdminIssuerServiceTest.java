package com.credivault;

import com.credivault.dto.AdminIssuerRegistrationRequest;
import com.credivault.dto.AdminIssuerStatusRequest;
import com.credivault.entity.Institution;
import com.credivault.entity.User;
import com.credivault.exception.EmailAlreadyRegisteredException;
import com.credivault.repository.InstitutionRepository;
import com.credivault.repository.UserRepository;
import com.credivault.service.AdminIssuerService;
import com.credivault.service.AuditService;
import com.credivault.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminIssuerServiceTest {

    private UserRepository userRepository;
    private InstitutionRepository institutionRepository;
    private UserService userService;
    private PasswordEncoder passwordEncoder;
    private AuditService auditService;
    private AdminIssuerService service;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        institutionRepository = mock(InstitutionRepository.class);
        userService = mock(UserService.class);
        passwordEncoder = mock(PasswordEncoder.class);
        auditService = mock(AuditService.class);
        service = new AdminIssuerService(
                userRepository,
                institutionRepository,
                userService,
                passwordEncoder,
                auditService
        );

        User admin = new User();
        admin.setRole("ADMIN");
        admin.setAccountStatus("ACTIVE");

        when(userService.findByEmail("admin@credivault.com"))
                .thenReturn(Optional.of(admin));

        authentication = new UsernamePasswordAuthenticationToken(
                "admin@credivault.com",
                null
        );
    }

    @Test
    void shouldRejectDuplicateIssuerEmail() {
        AdminIssuerRegistrationRequest request =
                new AdminIssuerRegistrationRequest();
        request.setFullName("Issuer A");
        request.setEmail("issuer@example.com");
        request.setInstitutionId(1L);

        when(userRepository.findByEmail("issuer@example.com"))
                .thenReturn(Optional.of(new User()));

        assertThrows(
                EmailAlreadyRegisteredException.class,
                () -> service.registerIssuer(request, authentication)
        );
    }

    @Test
    void deactivatingIssuerShouldIncrementTokenVersion() {
        Institution institution = new Institution();
        institution.setInstitutionId(1L);
        institution.setInstitutionName("University A");

        User issuer = new User();
        issuer.setUserId(10L);
        issuer.setEmail("issuer@example.com");
        issuer.setRole("ISSUER");
        issuer.setAccountStatus("ACTIVE");
        issuer.setTokenVersion(3);
        issuer.setInstitution(institution);

        when(userRepository.findById(10L))
                .thenReturn(Optional.of(issuer));
        when(userRepository.save(issuer))
                .thenReturn(issuer);

        AdminIssuerStatusRequest request =
                new AdminIssuerStatusRequest();
        request.setAccountStatus("INACTIVE");

        service.changeStatus(10L, request, authentication);

        assertEquals(4, issuer.getTokenVersion());
        assertEquals("INACTIVE", issuer.getAccountStatus());
    }
}
