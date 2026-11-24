package com.credivault.service;

import com.credivault.entity.Institution;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Service
public class DigitalSignatureService {

    private final PrivateKey privateKey;
    private final InstitutionKeyService institutionKeyService;

    public DigitalSignatureService(
            @Value("${CREDIVAULT_ISSUER_PRIVATE_KEY:}") String privateKeyBase64) {
        this.privateKey = loadOptionalPrivateKey(privateKeyBase64);
        this.institutionKeyService = null;
    }

    @Autowired
    public DigitalSignatureService(
            @Value("${CREDIVAULT_ISSUER_PRIVATE_KEY:}") String privateKeyBase64,
            InstitutionKeyService institutionKeyService) {
        this.privateKey = loadRequiredPrivateKey(privateKeyBase64);
        this.institutionKeyService = institutionKeyService;
    }

    public String sign(String data) {
        if (privateKey == null) {
            throw new IllegalStateException(
                    "CREDIVAULT_ISSUER_PRIVATE_KEY is not configured"
            );
        }

        try {
            Signature signature =
                    Signature.getInstance("SHA256withRSA");

            signature.initSign(privateKey);

            signature.update(
                    data.getBytes(StandardCharsets.UTF_8)
            );

            byte[] signedBytes = signature.sign();

            return Base64.getEncoder()
                    .encodeToString(signedBytes);

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Failed to digitally sign credential data",
                    e
            );
        }
    }

    public String sign(String data, Institution institution) {
            PrivateKey signingKey = privateKey;

            if (institutionKeyService != null) {
                PrivateKey institutionKey =
                        institutionKeyService.decryptPrivateKey(institution);

                if (institutionKey != null) {
                    signingKey = institutionKey;
                }
            }

            if (signingKey == null) {
                throw new IllegalStateException(
                        "No signing private key is configured for this institution"
                );
            }

            try {
                Signature signature =
                        Signature.getInstance("SHA256withRSA");
                signature.initSign(signingKey);
                signature.update(data.getBytes(StandardCharsets.UTF_8));
                return Base64.getEncoder()
                        .encodeToString(signature.sign());
            } catch (Exception exception) {
                throw new IllegalStateException(
                        "Failed to digitally sign credential data",
                        exception
                );
            }
    }

    public boolean verify(
            String data,
            String digitalSignature,
            String publicKeyBase64) {

        try {
            PublicKey publicKey =
                    loadPublicKey(publicKeyBase64);

            Signature signature =
                    Signature.getInstance("SHA256withRSA");

            signature.initVerify(publicKey);

            signature.update(
                    data.getBytes(StandardCharsets.UTF_8)
            );

            byte[] signatureBytes =
                    Base64.getDecoder()
                            .decode(digitalSignature);

            return signature.verify(signatureBytes);

        } catch (Exception e) {
            return false;
        }
    }

    private PrivateKey loadPrivateKey(
            String privateKeyBase64) {

        try {
            byte[] keyBytes =
                    Base64.getDecoder()
                            .decode(privateKeyBase64);

            PKCS8EncodedKeySpec keySpec =
                    new PKCS8EncodedKeySpec(keyBytes);

            KeyFactory keyFactory =
                    KeyFactory.getInstance("RSA");

            return keyFactory.generatePrivate(keySpec);

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Failed to load issuer private key",
                    e
            );
        }
    }

    private PrivateKey loadOptionalPrivateKey(
            String privateKeyBase64) {

        if (privateKeyBase64 == null
                || privateKeyBase64.isBlank()) {
            return null;
        }

        return loadPrivateKey(privateKeyBase64);
    }

    private PrivateKey loadRequiredPrivateKey(
            String privateKeyBase64) {

        if (privateKeyBase64 == null
                || privateKeyBase64.isBlank()) {
            throw new IllegalStateException(
                    "CREDIVAULT_ISSUER_PRIVATE_KEY is required for demo credential signing"
            );
        }

        return loadPrivateKey(privateKeyBase64);
    }

    private PublicKey loadPublicKey(
            String publicKeyBase64) {

        try {
            byte[] keyBytes =
                    Base64.getDecoder()
                            .decode(publicKeyBase64);

            X509EncodedKeySpec keySpec =
                    new X509EncodedKeySpec(keyBytes);

            KeyFactory keyFactory =
                    KeyFactory.getInstance("RSA");

            return keyFactory.generatePublic(keySpec);

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Failed to load institution public key",
                    e
            );
        }
    }
}