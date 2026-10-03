package com.credivault.service;

import com.credivault.entity.Credential;
import com.credivault.repository.CredentialRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CredentialService {

    private final CredentialRepository credentialRepository;

    public CredentialService(CredentialRepository credentialRepository) {
        this.credentialRepository = credentialRepository;
    }

    public Optional<Credential> findByCredentialCode(String credentialCode) {
        return credentialRepository.findByCredentialCode(credentialCode);
    }
}