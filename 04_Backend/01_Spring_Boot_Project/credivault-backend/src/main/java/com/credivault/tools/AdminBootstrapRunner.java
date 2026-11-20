package com.credivault.tools;

import com.credivault.entity.User;
import com.credivault.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Locale;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log =
            LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrapRunner(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {

        String email = System.getenv("ADMIN_BOOTSTRAP_EMAIL");
        String password = System.getenv("ADMIN_BOOTSTRAP_PASSWORD");

        // Bootstrap is inactive unless temporary credentials are supplied.
        if (email == null || email.isBlank()
                || password == null || password.isBlank()) {

            log.info("Administrator bootstrap skipped.");
            return;
        }

        email = email.trim().toLowerCase(Locale.ROOT);

        if (password.length() < 12) {
            throw new IllegalStateException(
                    "Administrator password must contain at least 12 characters."
            );
        }

        // Never create another initial administrator.
        if (userRepository.existsByRoleIgnoreCase("ADMIN")) {
            log.warn("Administrator already exists. Bootstrap skipped.");
            return;
        }

        // Never overwrite an existing non-admin account.
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalStateException(
                    "This email already belongs to an existing account."
            );
        }

        User admin = new User();

        admin.setFullName("CrediVault Administrator");
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole("ADMIN");
        admin.setAccountStatus("ACTIVE");
        admin.setCreatedAt(LocalDateTime.now());

        // Administrators are not associated with a single institution.
        admin.setInstitution(null);

        userRepository.save(admin);

        log.info(
                "Initial administrator account created successfully: {}",
                email
        );
    }
}