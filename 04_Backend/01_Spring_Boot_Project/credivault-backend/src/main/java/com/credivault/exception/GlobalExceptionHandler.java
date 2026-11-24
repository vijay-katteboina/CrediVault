package com.credivault.exception;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ResponseEntity<Map<String, String>> handleEmailAlreadyRegistered(
            EmailAlreadyRegisteredException exception) {

        Map<String, String> response = Map.of(
                "error", "EMAIL_ALREADY_REGISTERED",
                "message", exception.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpectedException(
            Exception exception) {

        if (exception instanceof ResponseStatusException statusException) {
            HttpStatusCode status = statusException.getStatusCode();

            if (status.is5xxServerError()) {
                logger.error(
                        "Request failed with HTTP {}.",
                        status.value(),
                        exception
                );
            }

            String message = status.is5xxServerError()
                    ? safeMessage(status)
                    : statusException.getReason();
            if (message == null || message.isBlank()) {
                message = safeMessage(status);
            }

            return response(status, status.toString(), message);
        }

        if (exception instanceof ErrorResponse errorResponse) {
            HttpStatusCode status = errorResponse.getStatusCode();

            if (status.is5xxServerError()) {
                logger.error(
                        "Request failed with HTTP {}.",
                        status.value(),
                        exception
                );
            }

            return response(
                    status,
                    status.toString(),
                    safeMessage(status)
            );
        }

        logger.error("Unhandled server error.", exception);

        return response(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "The request could not be completed. Please try again."
        );
    }

    private ResponseEntity<Map<String, String>> response(
            HttpStatusCode status,
            String error,
            String message) {

        return ResponseEntity
                .status(status)
                .body(Map.of(
                        "error", error,
                        "message", message
                ));
    }

    private String safeMessage(HttpStatusCode status) {
        return switch (status.value()) {
            case 400 -> "The request is invalid.";
            case 401 -> "Authentication is required.";
            case 403 -> "You are not allowed to perform this action.";
            case 404 -> "The requested resource was not found.";
            case 409 -> "The request conflicts with existing data.";
            case 503 -> "The service is temporarily unavailable.";
            default -> status.is4xxClientError()
                    ? "The request could not be completed."
                    : "The service could not complete the request.";
        };
    }
}