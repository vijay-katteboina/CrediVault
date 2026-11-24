package com.credivault;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.security.GeneralSecurityException;
import java.security.KeyPairGenerator;
import java.util.Base64;

@SpringBootTest
class CredivaultBackendApplicationTests {

    @DynamicPropertySource
    static void registerTestProperties(
            DynamicPropertyRegistry registry) {

        try {
            // Generate a temporary key for the test context only.
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

    @Test
    void contextLoads() {
        // Passing this test means the Spring context loaded successfully.
    }
}