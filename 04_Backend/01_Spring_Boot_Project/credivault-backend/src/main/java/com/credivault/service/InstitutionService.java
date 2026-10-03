package com.credivault.service;

import com.credivault.entity.Institution;
import com.credivault.repository.InstitutionRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class InstitutionService {

    private final InstitutionRepository institutionRepository;

    public InstitutionService(InstitutionRepository institutionRepository) {
        this.institutionRepository = institutionRepository;
    }

    public Optional<Institution> findByCode(String institutionCode) {
        return institutionRepository.findByInstitutionCode(institutionCode);
    }
}