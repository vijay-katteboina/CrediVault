package com.credivault.service;

import com.credivault.dto.RegisterRequest;
import com.credivault.entity.User;
import com.credivault.exception.EmailAlreadyRegisteredException;
import com.credivault.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

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
}