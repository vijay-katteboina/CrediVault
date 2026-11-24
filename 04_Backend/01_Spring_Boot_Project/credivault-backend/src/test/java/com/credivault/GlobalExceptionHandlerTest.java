package com.credivault;

import com.credivault.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler =
            new GlobalExceptionHandler();

    @Test
    void preservesResponseStatusExceptionStatusAndSafeReason() {
        var response = handler.handleUnexpectedException(
                new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Duplicate institution code"
                )
        );

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(
                "Duplicate institution code",
                response.getBody().get("message")
        );
    }

    @Test
    void hidesUnexpectedExceptionDetailsFromResponse() {
        String internalDetail = "sensitive internal failure detail";
        var response = handler.handleUnexpectedException(
                new IllegalStateException(internalDetail)
        );
        String responseText = response.getBody().toString();

        assertEquals(
                HttpStatus.INTERNAL_SERVER_ERROR,
                response.getStatusCode()
        );
        assertTrue(response.getBody().containsKey("message"));
        assertFalse(responseText.contains(internalDetail));
    }

    @Test
    void hidesServerErrorReasonWhilePreservingStatus() {
        String internalDetail = "sensitive server failure detail";
        var response = handler.handleUnexpectedException(
                new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        internalDetail
                )
        );

        assertEquals(
                HttpStatus.INTERNAL_SERVER_ERROR,
                response.getStatusCode()
        );
        assertFalse(response.getBody().toString().contains(internalDetail));
    }
}
