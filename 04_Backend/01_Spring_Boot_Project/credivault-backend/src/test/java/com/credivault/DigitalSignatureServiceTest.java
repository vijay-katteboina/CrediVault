package com.credivault;

import static org.junit.jupiter.api.Assertions.*;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.credivault.service.DigitalSignatureService;

class DigitalSignatureServiceTest {

    private DigitalSignatureService digitalSignatureService;
    private String publicKeyBase64;

    @BeforeEach
    void setUp() throws Exception {

        KeyPairGenerator generator =
                KeyPairGenerator.getInstance("RSA");

        generator.initialize(2048);

        KeyPair keyPair = generator.generateKeyPair();

        String privateKeyBase64 =
                Base64.getEncoder()
                        .encodeToString(
                                keyPair.getPrivate().getEncoded()
                        );

        publicKeyBase64 =
                Base64.getEncoder()
                        .encodeToString(
                                keyPair.getPublic().getEncoded()
                        );

        digitalSignatureService =
                new DigitalSignatureService(privateKeyBase64);
    }

    @Test
    void shouldSignAndVerifyOriginalData() {

        String data = "CrediVault Test Credential";

        String signature =
                digitalSignatureService.sign(data);

        assertNotNull(signature);

        assertTrue(
                digitalSignatureService.verify(
                        data,
                        signature,
                        publicKeyBase64
                )
        );
    }

    @Test
    void shouldRejectModifiedData() {

        String originalData =
                "CrediVault Test Credential";

        String modifiedData =
                "Modified Credential";

        String signature =
                digitalSignatureService.sign(originalData);

        assertFalse(
                digitalSignatureService.verify(
                        modifiedData,
                        signature,
                        publicKeyBase64
                )
        );
    }
}