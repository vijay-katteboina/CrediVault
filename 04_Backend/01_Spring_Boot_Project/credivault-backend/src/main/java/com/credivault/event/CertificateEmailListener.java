package com.credivault.event;

import com.credivault.entity.Credential;
import com.credivault.repository.CredentialRepository;
import com.credivault.service.CertificatePdfService;
import com.credivault.service.EmailService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class CertificateEmailListener {

    private static final Logger logger =
            LoggerFactory.getLogger(CertificateEmailListener.class);

    private final CertificatePdfService certificatePdfService;
    private final EmailService emailService;
    private final CredentialRepository credentialRepository;

    public CertificateEmailListener(
            CertificatePdfService certificatePdfService,
            EmailService emailService,
            CredentialRepository credentialRepository) {

        this.certificatePdfService = certificatePdfService;
        this.emailService = emailService;
        this.credentialRepository = credentialRepository;
    }

    /**
     * Sends the generated academic certificate after the
     * credential issuance transaction has successfully committed.
     *
     * Email failure will not roll back credential issuance.
     */
    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void handleCredentialIssued(
            CredentialIssuedEvent event) {

        try {
            logger.info(
                    "Processing certificate email for credential: {}",
                    event.credentialCode()
            );

            // Retrieve the issued credential.
            Credential credential = credentialRepository
                    .findByCredentialCode(event.credentialCode())
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Issued credential not found: "
                                            + event.credentialCode()
                            )
                    );

            // Generate the digitally verified PDF.
            byte[] certificatePdf =
                    certificatePdfService.generateCertificate(
                            event.credentialCode()
                    );

            // Retrieve institution name.
            String institutionName =
                    credential.getInstitution().getInstitutionName();

            // Send certificate to the registered student email.
            emailService.sendCertificateEmail(
                    event.recipientEmail(),
                    event.studentName(),
                    institutionName,
                    event.credentialCode(),
                    certificatePdf
            );

            logger.info(
                    "Certificate email sent successfully for credential: {}",
                    event.credentialCode()
            );

        } catch (Exception exception) {

            logger.error(
                    "Certificate email failed for credential {}. "
                            + "The issued credential remains saved.",
                    event.credentialCode(),
                    exception
            );
        }
    }
}