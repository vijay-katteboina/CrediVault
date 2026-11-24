package com.credivault;

import com.credivault.entity.User;
import com.credivault.repository.PasswordResetTokenRepository;
import com.credivault.repository.UserRepository;
import com.credivault.service.EmailService;
import com.credivault.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServicePasswordResetTest {

    @Test
    void mailTransportFailureDoesNotEscapePasswordResetRequest() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordResetTokenRepository tokenRepository =
                mock(PasswordResetTokenRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        EmailService emailService = mock(EmailService.class);

        User user = new User();
        user.setUserId(1L);
        user.setEmail("user@example.test");

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(tokenRepository
                .findAllByUser_UserIdAndUsedAtIsNull(1L))
                .thenReturn(List.of());
        doThrow(new MailSendException("mail transport unavailable"))
                .when(emailService)
                .sendPasswordResetEmail(anyString(), anyString());

        UserService userService = new UserService(
                userRepository,
                tokenRepository,
                passwordEncoder,
                emailService
        );

        assertDoesNotThrow(
                () -> userService.requestPasswordReset(user.getEmail())
        );
        verify(tokenRepository).save(any());
    }

    @Test
    void emailPreparationFailureDoesNotEscapePasswordResetRequest() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordResetTokenRepository tokenRepository =
                mock(PasswordResetTokenRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        EmailService emailService = mock(EmailService.class);

        User user = new User();
        user.setUserId(2L);
        user.setEmail("user@example.test");

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(tokenRepository
                .findAllByUser_UserIdAndUsedAtIsNull(2L))
                .thenReturn(List.of());
        doThrow(new IllegalStateException("email preparation failed"))
                .when(emailService)
                .sendPasswordResetEmail(anyString(), anyString());

        UserService userService = new UserService(
                userRepository,
                tokenRepository,
                passwordEncoder,
                emailService
        );

        assertDoesNotThrow(
                () -> userService.requestPasswordReset(user.getEmail())
        );
        verify(tokenRepository).save(any());
    }
}
