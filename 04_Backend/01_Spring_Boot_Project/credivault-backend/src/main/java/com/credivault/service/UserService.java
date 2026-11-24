package com.credivault.service;

import com.credivault.dto.RegisterRequest;
import com.credivault.entity.PasswordResetToken;
import com.credivault.entity.User;
import com.credivault.exception.EmailAlreadyRegisteredException;
import com.credivault.repository.PasswordResetTokenRepository;
import com.credivault.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private static final Logger logger =
            LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${credivault.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private static final int TOKEN_EXPIRATION_MINUTES = 15;

    public UserService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {

        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    // Find user by email
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Register a new student
    public User registerUser(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new EmailAlreadyRegisteredException(
                    "Email already registered"
            );
        }

        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );

        user.setRole("STUDENT");
        user.setAccountStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    // Request password reset
    @Transactional
    public void requestPasswordReset(String email) {

        Optional<User> optionalUser =
                userRepository.findByEmail(email);

        // Do not reveal whether the email exists.
        if (optionalUser.isEmpty()) {
            return;
        }

        User user = optionalUser.get();

        // Invalidate previous unused tokens.
        List<PasswordResetToken> previousTokens =
                tokenRepository.findAllByUser_UserIdAndUsedAtIsNull(
                        user.getUserId()
                );

        LocalDateTime now = LocalDateTime.now();

        for (PasswordResetToken previousToken : previousTokens) {
            previousToken.setUsedAt(now);
        }

        tokenRepository.saveAll(previousTokens);

        // Generate a cryptographically secure random token.
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        // Store only the SHA-256 hash.
        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken =
                new PasswordResetToken();

        resetToken.setUser(user);
        resetToken.setTokenHash(tokenHash);
        resetToken.setCreatedAt(now);

        resetToken.setExpiresAt(
                now.plusMinutes(TOKEN_EXPIRATION_MINUTES)
        );

        resetToken.setUsedAt(null);

        tokenRepository.save(resetToken);

        // Construct the frontend reset link.
        String resetLink =
                frontendUrl
                        + "/reset-password?token="
                        + rawToken;

        // Send reset email.
        try {
            emailService.sendPasswordResetEmail(
                    user.getEmail(),
                    resetLink
            );
        } catch (MailException | IllegalStateException exception) {
            logger.error(
                    "Password-reset email delivery failed; preserving the generic response.",
                    exception
            );
        }
    }

    // Reset password using a valid token
    @Transactional
    public void resetPassword(
            String rawToken,
            String newPassword) {

        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException(
                    "Invalid or expired password reset token"
            );
        }

        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken =
                tokenRepository.findByTokenHashForUpdate(tokenHash)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid or expired password reset token"
                                )
                        );

        LocalDateTime now = LocalDateTime.now();

        // Check expiration and single-use status.
        if (resetToken.getUsedAt() != null
                || !resetToken.getExpiresAt().isAfter(now)) {

            throw new IllegalArgumentException(
                    "Invalid or expired password reset token"
            );
        }

        User user = resetToken.getUser();

        // Update password using BCrypt.
        user.setPasswordHash(
                passwordEncoder.encode(newPassword)
        );

        // Invalidate all previously issued JWT sessions.
        int currentVersion = user.getTokenVersion() == null
                ? 0
                : user.getTokenVersion();

        user.setTokenVersion(currentVersion + 1);
        user.setMustChangePassword(false);

        userRepository.save(user);

        // Mark reset token as consumed.
        resetToken.setUsedAt(now);

        tokenRepository.save(resetToken);

        // Invalidate any other outstanding reset tokens.
        List<PasswordResetToken> otherTokens =
                tokenRepository
                        .findAllByUser_UserIdAndUsedAtIsNull(
                                user.getUserId()
                        );

        for (PasswordResetToken token : otherTokens) {
            token.setUsedAt(now);
        }

        tokenRepository.saveAll(otherTokens);
    }

    // SHA-256 hashing
    private String hashToken(String rawToken) {

        try {
            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    rawToken.getBytes(StandardCharsets.UTF_8)
            );

            return java.util.HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException exception) {

            throw new IllegalStateException(
                    "SHA-256 algorithm is unavailable",
                    exception
            );
        }
    }
}