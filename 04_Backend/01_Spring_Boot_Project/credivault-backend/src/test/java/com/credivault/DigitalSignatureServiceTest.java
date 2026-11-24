package com.credivault;

import static org.junit.jupiter.api.Assertions.*;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.credivault.service.DigitalSignatureService;
import com.credivault.service.InstitutionKeyService;
import com.credivault.entity.Institution;
import com.credivault.entity.InstitutionPrivateKey;
import com.credivault.repository.InstitutionPrivateKeyRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

class DigitalSignatureServiceTest {

    private DigitalSignatureService digitalSignatureService;
    private String publicKeyBase64;
    private String privateKeyBase64;

    @BeforeEach
    void setUp() throws Exception {

        KeyPairGenerator generator =
                KeyPairGenerator.getInstance("RSA");

        generator.initialize(2048);

        KeyPair keyPair = generator.generateKeyPair();

        privateKeyBase64 =
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

    @Test
    void autowiredConstructorRejectsMissingIssuerKey() {
        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> new DigitalSignatureService(
                        " ",
                        mock(InstitutionKeyService.class)
                )
        );

        assertTrue(exception.getMessage().contains(
                "CREDIVAULT_ISSUER_PRIVATE_KEY is required"
        ));
    }

    @Test
    void institutionWithoutStoredKeyFallsBackToGlobalSigner() {
        Institution demoInstitution = new Institution();
        InstitutionKeyService keyService =
                mock(InstitutionKeyService.class);
        when(keyService.decryptPrivateKey(demoInstitution))
                .thenReturn(null);

        DigitalSignatureService demoSigner =
                new DigitalSignatureService(privateKeyBase64, keyService);

        String data = "Existing demo credential";
        String signature = demoSigner.sign(data, demoInstitution);

        assertTrue(demoSigner.verify(data, signature, publicKeyBase64));
    }

    @Test
    void autowiredConstructorRejectsInvalidIssuerKey() {
        assertThrows(
                IllegalStateException.class,
                () -> new DigitalSignatureService(
                        "not-a-valid-key",
                        mock(InstitutionKeyService.class)
                )
        );
    }

    @Test
    void institutionKeyServiceRejectsMissingMasterKey() {
        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> new InstitutionKeyService(" ")
        );

        assertTrue(exception.getMessage().contains(
                "CREDIVAULT_KEY_MASTER_KEY is required"
        ));
    }

    @Test
    void institutionKeyServiceRejectsInvalidMasterKey() {
        assertThrows(
                IllegalStateException.class,
                () -> new InstitutionKeyService(
                        Base64.getEncoder().encodeToString(new byte[16])
                )
        );
    }

    @Test
    void shouldSignWithInstitutionSpecificPrivateKey() throws Exception {
        KeyPairGenerator generator =
                KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();

        String masterKey =
                Base64.getEncoder().encodeToString(
                        new byte[32]
                );

        Institution institution = new Institution();
        institution.setInstitutionId(100L);

        InstitutionPrivateKeyRepository keyRepository =
                mock(InstitutionPrivateKeyRepository.class);

        InstitutionKeyService keyService =
                new InstitutionKeyService(masterKey, keyRepository);

        when(keyRepository.save(any(InstitutionPrivateKey.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );

        InstitutionPrivateKey record =
                keyService.storeEncryptedPrivateKey(
                institution,
                keyPair.getPrivate(),
                LocalDateTime.now()
        );

        when(keyRepository
                .findByInstitutionInstitutionId(100L))
                .thenReturn(Optional.of(record));

        String institutionPublicKey =
                InstitutionKeyService.encodePublicKey(
                        keyPair.getPublic()
                );

        DigitalSignatureService institutionalSigner =
                new DigitalSignatureService(
                        privateKeyBase64ForTest(),
                        keyService
                );

        String data = "Institution-specific credential";
        String signature =
                institutionalSigner.sign(data, institution);

        assertTrue(
                institutionalSigner.verify(
                        data,
                        signature,
                        institutionPublicKey
                )
        );

        KeyPairGenerator otherGenerator =
                KeyPairGenerator.getInstance("RSA");
        otherGenerator.initialize(2048);
        String otherPublicKey =
                Base64.getEncoder().encodeToString(
                        otherGenerator.generateKeyPair()
                                .getPublic()
                                .getEncoded()
                );

        assertFalse(
                institutionalSigner.verify(
                        data,
                        signature,
                        otherPublicKey
                )
        );
    }

    private String privateKeyBase64ForTest() throws Exception {
        KeyPairGenerator generator =
                KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return Base64.getEncoder().encodeToString(
                generator.generateKeyPair()
                        .getPrivate()
                        .getEncoded()
        );
    }
}