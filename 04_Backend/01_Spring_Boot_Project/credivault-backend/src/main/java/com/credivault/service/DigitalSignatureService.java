package com.credivault.service;

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

    public DigitalSignatureService(
            @Value("${credivault.issuer.private-key}") String privateKeyBase64) {

        this.privateKey = loadPrivateKey(privateKeyBase64);
    }

    public String sign(String data) {

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