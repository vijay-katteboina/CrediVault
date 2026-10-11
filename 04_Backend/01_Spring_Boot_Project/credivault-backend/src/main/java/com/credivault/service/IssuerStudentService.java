package com.credivault.service;

import com.credivault.dto.IssuerStudentResponse;
import com.credivault.entity.Institution;
import com.credivault.entity.Student;
import com.credivault.entity.User;
import com.credivault.repository.StudentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class IssuerStudentService {

    private final StudentRepository studentRepository;
    private final UserService userService;

    public IssuerStudentService(
            StudentRepository studentRepository,
            UserService userService) {

        this.studentRepository = studentRepository;
        this.userService = userService;
    }

    /**
     * Returns students belonging only to the authenticated
     * issuer's active institution.
     */
    @Transactional(readOnly = true)
    public List<IssuerStudentResponse> getStudentsForIssuer(
            String issuerEmail) {

        // 1. Find the authenticated user.
        User issuer = userService
                .findByEmail(issuerEmail)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Authenticated issuer not found"
                        )
                );

        // 2. Verify issuer role.
        if (!"ISSUER".equalsIgnoreCase(issuer.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only issuers can access the student list"
            );
        }

        // 3. Verify issuer account status.
        if (!"ACTIVE".equalsIgnoreCase(
                issuer.getAccountStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Issuer account is not active"
            );
        }

        // 4. Find the institution assigned to the issuer.
        Institution institution = issuer.getInstitution();

        if (institution == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Issuer is not associated with an institution"
            );
        }

        // 5. Verify institution status.
        if (!"ACTIVE".equalsIgnoreCase(
                institution.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Issuer's institution is not active"
            );
        }

        // 6. Retrieve students belonging to this institution only.
        List<Student> students =
                studentRepository
                        .findByInstitution_InstitutionIdOrderByUser_FullNameAsc(
                                institution.getInstitutionId()
                        );

        // 7. Convert entities into safe response DTOs.
        return students.stream()
                .map(student -> new IssuerStudentResponse(
                        student.getStudentId(),
                        student.getStudentNumber(),
                        student.getUser().getFullName(),
                        student.getUser().getEmail(),
                        student.getCourse(),
                        student.getAcademicYear()
                ))
                .toList();
    }
}