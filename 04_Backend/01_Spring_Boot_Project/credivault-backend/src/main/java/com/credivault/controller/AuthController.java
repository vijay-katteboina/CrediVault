package com.credivault.controller;

import com.credivault.dto.AuthResponse;
import com.credivault.dto.LoginRequest;
import com.credivault.dto.RegisterRequest;
import com.credivault.dto.UserProfileResponse;
import com.credivault.dto.ForgotPasswordRequest;
import com.credivault.dto.ResetPasswordRequest;

import com.credivault.entity.User;

import com.credivault.service.JwtService;
import com.credivault.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(
            AuthenticationManager authenticationManager,
            UserService userService,
            JwtService jwtService) {

        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.jwtService = jwtService;
    }

    /**
     * Register a new student account.
     */
    @PostMapping("/register")
    public ResponseEntity<UserProfileResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        User user = userService.registerUser(request);

        UserProfileResponse response =
                new UserProfileResponse(
                        user.getUserId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getRole(),
                        user.getAccountStatus()
                );

        return ResponseEntity.ok(response);
    }

    /**
     * Authenticate an existing user and return a JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userService.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated user not found"
                        )
                );

        if (user.isMustChangePassword()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Password change required"
            );
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole(),
                user.getTokenVersion()
        );

        AuthResponse response = new AuthResponse(
                token,
                user.getRole()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Return the currently authenticated user's safe profile.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            Authentication authentication) {

        String email = authentication.getName();

        User user = userService.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated user not found"
                        )
                );

        UserProfileResponse response =
                new UserProfileResponse(
                        user.getUserId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getRole(),
                        user.getAccountStatus()
                );

        return ResponseEntity.ok(response);
    }

    /**
     * Request a password reset email.
     *
     * Always returns a generic response to prevent
     * email account enumeration.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        userService.requestPasswordReset(request.getEmail());

        return ResponseEntity.ok(
                "If an account exists with this email, " +
                "a password reset link will be sent."
        );
    }

    /**
     * Reset password using a valid reset token.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        userService.resetPassword(
                request.getToken(),
                request.getNewPassword()
        );

        return ResponseEntity.ok(
                "Password has been reset successfully."
        );
    }
}