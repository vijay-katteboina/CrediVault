package com.credivault.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class QrCodeService {

    @Value("${credivault.frontend.url}")
    private String frontendUrl;

    private static final int QR_WIDTH = 300;
    private static final int QR_HEIGHT = 300;

    /**
     * Generates a QR code containing the public verification URL.
     *
     * Example:
     * http://localhost:5173/verify?code=CV-XXXXXXXX
     *
     * @param credentialCode unique credential code
     * @return QR code as PNG image bytes
     */
    public byte[] generateVerificationQr(String credentialCode) {

        if (credentialCode == null || credentialCode.isBlank()) {
            throw new IllegalArgumentException(
                    "Credential code cannot be empty"
            );
        }

        try {
            String verificationUrl = buildVerificationUrl(credentialCode);

            QRCodeWriter qrCodeWriter = new QRCodeWriter();

            Map<EncodeHintType, Object> hints = new HashMap<>();

            hints.put(
                    EncodeHintType.ERROR_CORRECTION,
                    ErrorCorrectionLevel.H
            );

            hints.put(
                    EncodeHintType.MARGIN,
                    2
            );

            BitMatrix bitMatrix = qrCodeWriter.encode(
                    verificationUrl,
                    BarcodeFormat.QR_CODE,
                    QR_WIDTH,
                    QR_HEIGHT,
                    hints
            );

            ByteArrayOutputStream outputStream =
                    new ByteArrayOutputStream();

            MatrixToImageWriter.writeToStream(
                    bitMatrix,
                    "PNG",
                    outputStream
            );

            return outputStream.toByteArray();

        } catch (WriterException | IOException exception) {

            throw new IllegalStateException(
                    "Failed to generate credential verification QR code",
                    exception
            );
        }
    }

    /**
     * Builds the public verification URL.
     */
    private String buildVerificationUrl(String credentialCode) {

        String baseUrl = frontendUrl.replaceAll("/+$", "");

        String encodedCredentialCode = URLEncoder.encode(
                credentialCode,
                StandardCharsets.UTF_8
        );

        return baseUrl
                + "/verify?code="
                + encodedCredentialCode;
    }
}