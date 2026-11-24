package com.credivault.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends a password reset email.
     */
    public void sendPasswordResetEmail(
            String recipientEmail,
            String resetLink) {

        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(recipientEmail);
            helper.setSubject("CrediVault - Password Reset Request");

            String emailContent = """
                    <html>
                    <body style="font-family: Arial, sans-serif;
                                 color: #1f2937;">

                        <div style="max-width: 600px;
                                    margin: auto;
                                    padding: 25px;
                                    border: 1px solid #e5e7eb;
                                    border-radius: 10px;">

                            <h2 style="color: #3730a3;">
                                CrediVault
                            </h2>

                            <h3>Password Reset Request</h3>

                            <p>
                                We received a request to reset your
                                CrediVault account password.
                            </p>

                            <p>
                                Click the button below to choose
                                a new password.
                            </p>

                            <a href="%s"
                               style="display: inline-block;
                                      padding: 12px 24px;
                                      background-color: #3730a3;
                                      color: white;
                                      text-decoration: none;
                                      border-radius: 6px;">
                                Reset Password
                            </a>

                            <p>
                                This link expires in 15 minutes
                                and can only be used once.
                            </p>

                            <p>
                                If you did not request this change,
                                you can safely ignore this email.
                            </p>

                            <hr>

                            <small>
                                CrediVault Digital Academic
                                Credential Platform
                            </small>

                        </div>
                    </body>
                    </html>
                    """.formatted(resetLink);

            helper.setText(emailContent, true);

            mailSender.send(message);

        } catch (MessagingException exception) {
            throw new IllegalStateException(
                    "Unable to prepare password reset email",
                    exception
            );
        }
    }

    /**
     * Sends an issued academic certificate as a PDF attachment.
     */
    public void sendCertificateEmail(
            String recipientEmail,
            String studentName,
            String institutionName,
            String credentialCode,
            byte[] certificatePdf) {

        if (certificatePdf == null || certificatePdf.length == 0) {
            throw new IllegalArgumentException(
                    "Certificate PDF cannot be empty"
            );
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(recipientEmail);

            helper.setSubject(
                    "CrediVault - Your Academic Certificate"
            );

            String emailContent = """
                    <html>
                    <body style="font-family: Arial, sans-serif;
                                 color: #1f2937;
                                 background-color: #f8fafc;
                                 padding: 20px;">

                        <div style="max-width: 600px;
                                    margin: auto;
                                    padding: 30px;
                                    background-color: white;
                                    border: 1px solid #e5e7eb;
                                    border-radius: 10px;">

                            <h2 style="color: #3730a3;">
                                CrediVault
                            </h2>

                            <h3>Academic Certificate Issued Successfully</h3>

                            <p>Dear %s,</p>

                            <p>
                                Congratulations! Your academic credential
                                has been successfully issued by
                                <strong>%s</strong>.
                            </p>

                            <p>
                                Your certificate is attached to this email
                                as a PDF document.
                            </p>

                            <p>
                                <strong>Credential Code:</strong> %s
                            </p>

                            <p>
                                You can verify the authenticity of your
                                certificate by scanning the QR code
                                printed on it.
                            </p>

                            <p>
                                You can also access your certificate
                                anytime through your CrediVault
                                student wallet.
                            </p>

                            <hr>

                            <small>
                                CrediVault Digital Academic
                                Credential Platform
                            </small>

                        </div>
                    </body>
                    </html>
                    """.formatted(
                    escapeHtml(studentName),
                    escapeHtml(institutionName),
                    escapeHtml(credentialCode)
            );

            helper.setText(emailContent, true);

            String fileName = "CrediVault-Certificate-"
                    + credentialCode.replaceAll("[^a-zA-Z0-9_-]", "_")
                    + ".pdf";

            helper.addAttachment(
                    fileName,
                    new ByteArrayResource(certificatePdf),
                    "application/pdf"
            );

            mailSender.send(message);

        } catch (MessagingException exception) {
            throw new IllegalStateException(
                    "Unable to prepare certificate email",
                    exception
            );
        }
    }

    /**
     * Escapes dynamic values before inserting them into HTML.
     */
    private String escapeHtml(String value) {

        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}