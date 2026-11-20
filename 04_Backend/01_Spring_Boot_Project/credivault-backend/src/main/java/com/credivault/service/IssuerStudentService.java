package com.credivault.service;

import com.credivault.dto.IssuerStudentCreateRequest;
import com.credivault.dto.IssuerStudentResponse;
import com.credivault.dto.IssuerStudentUpdateRequest;
import com.credivault.entity.Institution;
import com.credivault.entity.Student;
import com.credivault.entity.User;
import com.credivault.exception.EmailAlreadyRegisteredException;
import com.credivault.repository.StudentRepository;
import com.credivault.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class IssuerStudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public IssuerStudentService(
            StudentRepository studentRepository,
            UserRepository userRepository,
            UserService userService,
            PasswordEncoder passwordEncoder,
            AuditService auditService) {

        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    // =========================================================
    // 1. GET ALL STUDENTS
    // =========================================================

    @Transactional(readOnly = true)
    public List<IssuerStudentResponse> getStudentsForIssuer(
            String issuerEmail) {

        User issuer = getActiveIssuer(issuerEmail);

        List<Student> students =
                studentRepository
                        .findByInstitution_InstitutionIdOrderByUser_FullNameAsc(
                                issuer.getInstitution().getInstitutionId()
                        );

        return students.stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // 2. GET STUDENT BY ID
    // =========================================================

    @Transactional(readOnly = true)
    public IssuerStudentResponse getStudentForIssuer(
            Long studentId,
            String issuerEmail) {

        User issuer = getActiveIssuer(issuerEmail);

        Student student =
                findStudentForInstitution(
                        studentId,
                        issuer.getInstitution()
                );

        return toResponse(student);
    }

    // =========================================================
    // 3. REGISTER STUDENT
    // =========================================================

    @Transactional
    public IssuerStudentResponse createStudent(
            IssuerStudentCreateRequest request,
            String issuerEmail) {

        User issuer = getActiveIssuer(issuerEmail);

        Institution institution = issuer.getInstitution();

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        String studentNumber = request.getStudentNumber()
                .trim()
                .toUpperCase(Locale.ROOT);

        // Check duplicate email.
        if (userRepository.findByEmail(email).isPresent()) {
            throw new EmailAlreadyRegisteredException(
                    "Email already registered"
            );
        }

        // Check duplicate student number.
        if (studentRepository
                .findByStudentNumber(studentNumber)
                .isPresent()) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Student number already registered"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        // Create student login account.
        User studentUser = new User();

        studentUser.setFullName(request.getFullName().trim());
        studentUser.setEmail(email);

        studentUser.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );

        studentUser.setRole("STUDENT");
        studentUser.setAccountStatus("ACTIVE");
        studentUser.setCreatedAt(now);
        studentUser.setInstitution(institution);

        User savedUser = userRepository.save(studentUser);

        // Create academic student profile.
        Student student = new Student();

        student.setUser(savedUser);
        student.setInstitution(institution);
        student.setStudentNumber(studentNumber);
        student.setCourse(request.getCourse().trim());
        student.setAcademicYear(request.getAcademicYear().trim());
        student.setCreatedAt(now);

        Student savedStudent =
                studentRepository.save(student);

        // Record the registration event.
        auditService.record(
                issuer,
                "CREATE_STUDENT",
                "STUDENT",
                String.valueOf(savedStudent.getStudentId()),
                "Registered student " + studentNumber
        );

        return toResponse(savedStudent);
    }

    // =========================================================
    // 4. UPDATE STUDENT PROFILE
    // =========================================================

    @Transactional
    public IssuerStudentResponse updateStudent(
            Long studentId,
            IssuerStudentUpdateRequest request,
            String issuerEmail) {

        User issuer = getActiveIssuer(issuerEmail);

        Student student =
                findStudentForInstitution(
                        studentId,
                        issuer.getInstitution()
                );

        User studentUser = student.getUser();

        studentUser.setFullName(
                request.getFullName().trim()
        );

        student.setCourse(
                request.getCourse().trim()
        );

        student.setAcademicYear(
                request.getAcademicYear().trim()
        );

        userRepository.save(studentUser);

        Student updatedStudent =
                studentRepository.save(student);

        auditService.record(
                issuer,
                "UPDATE_STUDENT",
                "STUDENT",
                String.valueOf(studentId),
                "Updated academic profile for "
                        + student.getStudentNumber()
        );

        return toResponse(updatedStudent);
    }

    // =========================================================
    // 5. ACTIVATE / DEACTIVATE STUDENT
    // =========================================================

    @Transactional
    public IssuerStudentResponse changeStudentStatus(
            Long studentId,
            String requestedStatus,
            String issuerEmail) {

        User issuer = getActiveIssuer(issuerEmail);

        Student student =
                findStudentForInstitution(
                        studentId,
                        issuer.getInstitution()
                );

        User studentUser = student.getUser();

        String newStatus = requestedStatus
                .trim()
                .toUpperCase(Locale.ROOT);

        if (!newStatus.equals("ACTIVE")
                && !newStatus.equals("INACTIVE")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be ACTIVE or INACTIVE"
            );
        }

        String currentStatus =
                studentUser.getAccountStatus();

        if (newStatus.equalsIgnoreCase(currentStatus)) {
            return toResponse(student);
        }

        studentUser.setAccountStatus(newStatus);

        userRepository.save(studentUser);

        auditService.record(
                issuer,
                newStatus.equals("ACTIVE")
                        ? "ACTIVATE_STUDENT"
                        : "DEACTIVATE_STUDENT",
                "STUDENT",
                String.valueOf(studentId),
                "Student " + student.getStudentNumber()
                        + " status changed to " + newStatus
        );

        return toResponse(student);
    }

    // =========================================================
    // 6. ISSUER AUTHORIZATION
    // =========================================================

    private User getActiveIssuer(String issuerEmail) {

        User issuer = userService.findByEmail(issuerEmail)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Authenticated issuer not found"
                        )
                );

        if (!"ISSUER".equalsIgnoreCase(issuer.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only issuers can manage students"
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(
                issuer.getAccountStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Issuer account is not active"
            );
        }

        Institution institution = issuer.getInstitution();

        if (institution == null
                || institution.getInstitutionId() == null) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Issuer is not associated with an institution"
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(
                institution.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Issuer institution is not active"
            );
        }

        return issuer;
    }

    // =========================================================
    // 7. INSTITUTION-LEVEL STUDENT ACCESS
    // =========================================================

    private Student findStudentForInstitution(
            Long studentId,
            Institution issuerInstitution) {

        Student student =
                studentRepository.findById(studentId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Student not found"
                                )
                        );

        if (student.getInstitution() == null
                || !student.getInstitution()
                        .getInstitutionId()
                        .equals(issuerInstitution.getInstitutionId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to manage this student"
            );
        }

        return student;
    }

    // =========================================================
    // 8. ENTITY TO RESPONSE DTO
    // =========================================================

    private IssuerStudentResponse toResponse(Student student) {

        User user = student.getUser();

        return new IssuerStudentResponse(
                student.getStudentId(),
                student.getStudentNumber(),
                user.getFullName(),
                user.getEmail(),
                student.getCourse(),
                student.getAcademicYear(),
                user.getAccountStatus()
        );
    }
}