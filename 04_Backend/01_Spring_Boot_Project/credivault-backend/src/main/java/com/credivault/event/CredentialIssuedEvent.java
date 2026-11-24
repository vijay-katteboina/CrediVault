package com.credivault.event;

public record CredentialIssuedEvent(
        String credentialCode,
        String recipientEmail,
        String studentName
) {
}