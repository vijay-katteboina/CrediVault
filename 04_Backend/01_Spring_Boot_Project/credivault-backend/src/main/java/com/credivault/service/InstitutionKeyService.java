package com.credivault.service;

import com.credivault.entity.Institution;
import com.credivault.entity.InstitutionPrivateKey;
import com.credivault.repository.InstitutionPrivateKeyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.KeyFactory;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class InstitutionKeyService {

    private static final int GCM_TAG_LENGTH = 128;

    private final SecretKey encryptionKey;
    private final InstitutionPrivateKeyRepository privateKeyRepository;

    @Autowired
    public InstitutionKeyService(
            @Value("${credivault.key-master-key:}") String encryptionKeyBase64,
            InstitutionPrivateKeyRepository privateKeyRepository) {
        this.encryptionKey = loadEncryptionKey(encryptionKeyBase64);
        this.privateKeyRepository = privateKeyRepository;
    }

    public InstitutionKeyService(String encryptionKeyBase64) {
        this.encryptionKey = loadEncryptionKey(encryptionKeyBase64);
        this.privateKeyRepository = null;
    }

    public KeyPair generateRsaKeyPair() {
        try {
            KeyPairGenerator generator =
                    KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Failed to generate institution RSA key pair",
                    exception
            );
        }
    }

    public boolean isEncryptionKeyConfigured() {
        return encryptionKey != null;
    }

    public InstitutionPrivateKey storeEncryptedPrivateKey(
            Institution institution,
            PrivateKey privateKey,
            LocalDateTime now) {

        if (encryptionKey == null) {
            throw new IllegalStateException(
                    "CREDIVAULT_KEY_MASTER_KEY is required to register institutions"
            );
        }

        try {
            byte[] iv = new byte[12];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(
                    Cipher.ENCRYPT_MODE,
                    encryptionKey,
                    new GCMParameterSpec(GCM_TAG_LENGTH, iv)
            );

            byte[] encrypted =
                    cipher.doFinal(privateKey.getEncoded());

            InstitutionPrivateKey record =
                    new InstitutionPrivateKey();
            record.setInstitution(institution);
            record.setEncryptedKey(
                    Base64.getEncoder().encodeToString(encrypted)
            );
            record.setIv(
                    Base64.getEncoder().encodeToString(iv)
            );
            record.setKeyVersion(1);
            record.setCreatedAt(now);

            if (privateKeyRepository == null) {
                return record;
            }

            return privateKeyRepository.save(record);

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Failed to protect institution private key",
                    exception
            );
        }
    }

    public PrivateKey decryptPrivateKey(Institution institution) {
        InstitutionPrivateKey record = null;

        if (privateKeyRepository != null) {
            record = privateKeyRepository
                    .findByInstitutionInstitutionId(
                            institution.getInstitutionId()
                    )
                    .orElse(null);
        }

        if (record == null) {
            return null;
        }

        if (encryptionKey == null) {
            throw new IllegalStateException(
                    "CREDIVAULT_KEY_MASTER_KEY is required to use institution private keys"
            );
        }

        try {
            byte[] encrypted =
                    Base64.getDecoder().decode(
                            record.getEncryptedKey()
                    );
            byte[] iv =
                    Base64.getDecoder().decode(
                            record.getIv()
                    );

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(
                    Cipher.DECRYPT_MODE,
                    encryptionKey,
                    new GCMParameterSpec(GCM_TAG_LENGTH, iv)
            );

            byte[] privateKeyBytes =
                    cipher.doFinal(encrypted);

            PKCS8EncodedKeySpec keySpec =
                    new PKCS8EncodedKeySpec(privateKeyBytes);

            return KeyFactory.getInstance("RSA")
                    .generatePrivate(keySpec);

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Failed to load institution private key",
                    exception
            );
        }
    }

    public static String encodePublicKey(PublicKey publicKey) {
        return Base64.getEncoder()
                .encodeToString(publicKey.getEncoded());
    }

    private SecretKey loadEncryptionKey(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "CREDIVAULT_KEY_MASTER_KEY is required for institution key encryption"
            );
        }

        try {
            byte[] keyBytes =
                    Base64.getDecoder().decode(value.trim());

            if (keyBytes.length != 32) {
                throw new IllegalArgumentException(
                        "Key encryption master key must be 32 bytes"
                );
            }

            return new SecretKeySpec(keyBytes, "AES");

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Invalid CREDIVAULT_KEY_MASTER_KEY",
                    exception
            );
        }
    }
}
