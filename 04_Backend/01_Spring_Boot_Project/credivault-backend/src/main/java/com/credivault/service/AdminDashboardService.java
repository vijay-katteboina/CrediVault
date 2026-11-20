package com.credivault.service;

import com.credivault.dto.AdminDashboardResponse;
import com.credivault.repository.UserRepository;
import com.credivault.repository.StudentRepository;
import com.credivault.repository.InstitutionRepository;
import com.credivault.repository.AuditLogRepository;

import org.springframework.stereotype.Service;

@Service
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final InstitutionRepository institutionRepository;
    private final AuditLogRepository auditLogRepository;

    public AdminDashboardService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            InstitutionRepository institutionRepository,
            AuditLogRepository auditLogRepository) {

        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.institutionRepository = institutionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public AdminDashboardResponse getDashboardStatistics() {

        return new AdminDashboardResponse(

                userRepository.count(),

                studentRepository.count(),

                userRepository.countByRoleIgnoreCase("ISSUER"),

                institutionRepository.count(),

                userRepository.countByAccountStatusIgnoreCase("ACTIVE"),

                userRepository.countByAccountStatusIgnoreCase("INACTIVE"),

                auditLogRepository.count()
        );
    }
}