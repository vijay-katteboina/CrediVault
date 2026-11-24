package com.credivault;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.credivault.service.JwtService;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {

        String secret = "CrediVaultTestSecretKey12345678901234567890";

        jwtService = new JwtService(
                secret,
                3600000
        );
    }

    @Test
    void shouldGenerateAndExtractTokenData() {

        String email = "user@example.com";
        String role = "STUDENT";
        Integer tokenVersion = 0;

        String token = jwtService.generateToken(
                email,
                role,
                tokenVersion
        );

        assertNotNull(token);
        assertEquals(email, jwtService.extractEmail(token));
        assertEquals(role, jwtService.extractRole(token));
        assertEquals(tokenVersion, jwtService.extractTokenVersion(token));
    }

    @Test
    void shouldValidateCorrectToken() {

        String email = "user@example.com";
        String role = "STUDENT";

        String token = jwtService.generateToken(
                email,
                role,
                0
        );

        assertTrue(jwtService.isTokenValid(token, email));
    }

    @Test
    void shouldRejectTokenForDifferentEmail() {

        String token = jwtService.generateToken(
                "user@example.com",
                "STUDENT",
                0
        );

        assertFalse(
                jwtService.isTokenValid(
                        token,
                        "another@example.com"
                )
        );
    }

    @Test
    void shouldExtractCorrectTokenVersion() {

        String token = jwtService.generateToken(
                "user@example.com",
                "STUDENT",
                5
        );

        assertEquals(5, jwtService.extractTokenVersion(token));
    }

    @Test
    void shouldPreserveTokenVersionZero() {

        String token = jwtService.generateToken(
                "user@example.com",
                "STUDENT",
                0
        );

        assertEquals(0, jwtService.extractTokenVersion(token));
    }
}