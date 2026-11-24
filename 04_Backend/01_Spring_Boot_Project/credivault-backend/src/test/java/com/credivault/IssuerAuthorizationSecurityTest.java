package com.credivault;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.security.GeneralSecurityException;
import java.security.KeyPairGenerator;
import java.util.Base64;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class IssuerAuthorizationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    /**
     * Supply a temporary RSA private key for this test context.
     * This does not change the real issuer signing key.
     */
    @DynamicPropertySource
    static void registerTestProperties(
            DynamicPropertyRegistry registry) {

        try {
            KeyPairGenerator generator =
                    KeyPairGenerator.getInstance("RSA");

            generator.initialize(2048);

            String testPrivateKey = Base64.getEncoder()
                    .encodeToString(
                            generator.generateKeyPair()
                                    .getPrivate()
                                    .getEncoded()
                    );
            String testMasterKey = Base64.getEncoder()
                    .encodeToString(new byte[32]);

            registry.add(
                    "CREDIVAULT_ISSUER_PRIVATE_KEY",
                    () -> testPrivateKey
            );
            registry.add(
                    "credivault.key-master-key",
                    () -> testMasterKey
            );

        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException(
                    "Failed to generate the test signing key",
                    exception
            );
        }
    }

    /**
     * An unauthenticated request must be rejected.
     */
    @Test
    void unauthenticatedUserCannotAccessIssuerStudents()
            throws Exception {

        mockMvc.perform(
                        get("/api/v1/issuer/students")
                )
                .andExpect(status().isUnauthorized());
    }

    /**
     * Students must not access issuer-only endpoints.
     */
    @Test
    @WithMockUser(
            username = "student@test.example",
            roles = {"STUDENT"}
    )
    void studentCannotAccessIssuerStudents()
            throws Exception {

        mockMvc.perform(
                        get("/api/v1/issuer/students")
                )
                .andExpect(status().isForbidden());
    }

    /**
     * Verifiers must not access issuer-only endpoints.
     */
    @Test
    @WithMockUser(
            username = "verifier@test.example",
            roles = {"VERIFIER"}
    )
    void verifierCannotAccessIssuerStudents()
            throws Exception {

        mockMvc.perform(
                        get("/api/v1/issuer/students")
                )
                .andExpect(status().isForbidden());
    }

    /**
     * Administrators are also denied this issuer-only endpoint
     * unless the security rules explicitly grant them access.
     */
    @Test
    @WithMockUser(
            username = "admin@test.example",
            roles = {"ADMIN"}
    )
    void adminCannotAccessIssuerStudents()
            throws Exception {

        mockMvc.perform(
                        get("/api/v1/issuer/students")
                )
                .andExpect(status().isForbidden());
    }
}