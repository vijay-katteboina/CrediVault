package com.credivault.service;

import com.credivault.entity.Credential;
import com.credivault.entity.Institution;
import com.credivault.entity.Student;
import com.credivault.repository.CredentialRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.SerializationFeature;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import javax.imageio.ImageIO;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Objects;

@Service
public class CertificatePdfService {

    private final CredentialRepository credentialRepository;
    private final HashService hashService;
    private final DigitalSignatureService digitalSignatureService;
    private final QrCodeService qrCodeService;
    private final ObjectMapper objectMapper;
    private final RevocationService revocationService;

    private final Path storageDirectory;

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd MMMM yyyy");

    public CertificatePdfService(
            CredentialRepository credentialRepository,
            HashService hashService,
            DigitalSignatureService digitalSignatureService,
            QrCodeService qrCodeService,
            ObjectMapper objectMapper,
            RevocationService revocationService,
            @Value("${credivault.storage.directory:./credivault-storage}")
            String storageDirectory) {

        this.credentialRepository = credentialRepository;
        this.hashService = hashService;
        this.digitalSignatureService = digitalSignatureService;
        this.qrCodeService = qrCodeService;
        this.objectMapper = objectMapper;
        this.revocationService = revocationService;

        this.storageDirectory = Path.of(storageDirectory)
                .toAbsolutePath()
                .normalize();
    }

    /**
     * Generates an academic certificate after verifying
     * credential integrity and its RSA digital signature.
     */
    @Transactional(readOnly = true)
    public byte[] generateCertificate(String credentialCode) {

        if (credentialCode == null || credentialCode.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Credential code is required"
            );
        }

        Credential credential = credentialRepository
                .findByCredentialCode(credentialCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Credential not found"
                ));

        // Check the independent revocation record.
        boolean hasRevocationRecord =
                revocationService.findByCredentialId(
                        credential.getCredentialId()
                ).isPresent();

        if (hasRevocationRecord) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Certificate cannot be generated for a revoked credential"
            );
        }

        // Check credential status.
        if (!"ACTIVE".equalsIgnoreCase(credential.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Certificate cannot be generated for an inactive or revoked credential"
            );
        }

        Institution institution = credential.getInstitution();
        Student student = credential.getStudent();

        if (institution == null
                || student == null
                || student.getUser() == null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Incomplete credential information"
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(institution.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Certificate cannot be generated for an inactive institution"
            );
        }

        // Reconstruct canonical credential JSON.
        String canonicalData;

        try {
            canonicalData = objectMapper
                    .writer(
                            SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS
                    )
                    .writeValueAsString(
                            credential.getCredentialData()
                    );

        } catch (Exception exception) {

            throw new IllegalStateException(
                    "Unable to reconstruct credential data",
                    exception
            );
        }

        // Verify SHA-256 integrity.
        String calculatedHash =
                hashService.sha256(canonicalData);

        if (!Objects.equals(
                calculatedHash,
                credential.getDataHash())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Credential integrity verification failed"
            );
        }

        // Verify RSA digital signature.
        boolean signatureValid =
                digitalSignatureService.verify(
                        credential.getDataHash(),
                        credential.getDigitalSignature(),
                        institution.getPublicKey()
                );

        if (!signatureValid) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Credential digital signature verification failed"
            );
        }

        // Validate signed academic information.
        Map<String, Object> academicData =
                credential.getCredentialData();

        if (academicData == null || academicData.isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Academic credential data is missing"
            );
        }

        if (credential.getIssuedAt() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Credential issue date is missing"
            );
        }

        return createPdf(
                credential,
                institution,
                student,
                academicData
        );
    }

    /**
     * Creates the certificate PDF.
     */
    private byte[] createPdf(
            Credential credential,
            Institution institution,
            Student student,
            Map<String, Object> academicData) {

        try (
                PDDocument document = new PDDocument();
                ByteArrayOutputStream outputStream =
                        new ByteArrayOutputStream()
        ) {

            // Landscape A4 page.
            PDPage page = new PDPage(
                    new PDRectangle(
                            PDRectangle.A4.getHeight(),
                            PDRectangle.A4.getWidth()
                    )
            );

            document.addPage(page);

            float width = page.getMediaBox().getWidth();
            float height = page.getMediaBox().getHeight();

            try (
                    PDPageContentStream content =
                            new PDPageContentStream(document, page)
            ) {

                PDType1Font regular = new PDType1Font(
                        Standard14Fonts.FontName.TIMES_ROMAN
                );

                PDType1Font bold = new PDType1Font(
                        Standard14Fonts.FontName.TIMES_BOLD
                );

                PDType1Font italic = new PDType1Font(
                        Standard14Fonts.FontName.TIMES_ITALIC
                );

                // 1. Certificate background.
                drawBackground(content, width, height);

                // 2. Institution logo.
                drawInstitutionLogo(
                        document,
                        content,
                        institution
                );

                // 3. Institution heading.
                drawInstitutionHeader(
                        content,
                        institution,
                        bold,
                        regular,
                        width,
                        height
                );

                // 4. Certificate title.
                drawCertificateTitle(
                        content,
                        bold,
                        width,
                        height
                );

                // 5. Student and academic details.
                drawStudentDetails(
                        content,
                        credential,
                        student,
                        academicData,
                        regular,
                        bold,
                        italic,
                        width,
                        height
                );

                // 6. Decorative security seal.
                drawSecuritySeal(
                        content,
                        width,
                        height
                );

                // 7. Verification QR code.
                drawQrCode(
                        document,
                        content,
                        credential.getCredentialCode(),
                        width
                );

                // 8. Authorized signatory.
                drawSignatory(
                        content,
                        institution,
                        bold,
                        regular,
                        width
                );

                // 9. Certificate footer.
                drawFooter(
                        content,
                        credential,
                        regular,
                        width
                );
            }

            document.save(outputStream);

            return outputStream.toByteArray();

        } catch (IOException exception) {

            throw new IllegalStateException(
                    "Failed to generate academic certificate PDF",
                    exception
            );
        }
    }

    /**
     * Converts standard RGB values (0-255)
     * into PDFBox RGB values (0-1).
     */
    private void setStrokeRgb(
            PDPageContentStream content,
            int red,
            int green,
            int blue) throws IOException {

        content.setStrokingColor(
                red / 255f,
                green / 255f,
                blue / 255f
        );
    }

    /**
     * Draws the certificate background and decorative borders.
     */
    private void drawBackground(
            PDPageContentStream content,
            float width,
            float height) throws IOException {

        // Outer blue border.
        setStrokeRgb(content, 25, 55, 105);
        content.setLineWidth(5);

        content.addRect(
                20,
                20,
                width - 40,
                height - 40
        );

        content.stroke();

        // Inner golden border.
        setStrokeRgb(content, 180, 145, 65);
        content.setLineWidth(1.5f);

        content.addRect(
                29,
                29,
                width - 58,
                height - 58
        );

        content.stroke();

        // Additional decorative border.
        setStrokeRgb(content, 25, 55, 105);
        content.setLineWidth(0.7f);

        content.addRect(
                36,
                36,
                width - 72,
                height - 72
        );

        content.stroke();
    }

    /**
     * Loads and draws the institution logo.
     */
    private void drawInstitutionLogo(
            PDDocument document,
            PDPageContentStream content,
            Institution institution) throws IOException {

        String logoPath = institution.getLogoPath();

        if (logoPath == null || logoPath.isBlank()) {
            return;
        }

        Path imagePath = storageDirectory
                .resolve(logoPath)
                .normalize();

        // Prevent path traversal.
        if (!imagePath.startsWith(storageDirectory)) {

            throw new IllegalStateException(
                    "Invalid institution logo path"
            );
        }

        if (!Files.isRegularFile(imagePath)) {

            throw new IllegalStateException(
                    "Institution logo file not found"
            );
        }

        BufferedImage image = ImageIO.read(
                imagePath.toFile()
        );

        if (image == null) {

            throw new IllegalStateException(
                    "Unable to read institution logo"
            );
        }

        PDImageXObject logo =
                LosslessFactory.createFromImage(
                        document,
                        image
                );

        content.drawImage(
                logo,
                55,
                485,
                76,
                76
        );
    }

    /**
     * Institution name and address.
     */
    private void drawInstitutionHeader(
            PDPageContentStream content,
            Institution institution,
            PDType1Font bold,
            PDType1Font regular,
            float width,
            float height) throws IOException {

        drawCenteredText(
                content,
                institution.getInstitutionName(),
                bold,
                22,
                width / 2,
                height - 65
        );

        drawCenteredText(
                content,
                institution.getInstitutionAddress(),
                regular,
                10,
                width / 2,
                height - 84
        );

        drawCenteredText(
                content,
                "OFFICIAL ACADEMIC CREDENTIAL",
                bold,
                9,
                width / 2,
                height - 103
        );
    }

    /**
     * Certificate title.
     */
    private void drawCertificateTitle(
            PDPageContentStream content,
            PDType1Font bold,
            float width,
            float height) throws IOException {

        drawCenteredText(
                content,
                "CERTIFICATE OF ACHIEVEMENT",
                bold,
                29,
                width / 2,
                height - 165
        );

        setStrokeRgb(content, 180, 145, 65);
        content.setLineWidth(1.5f);

        content.moveTo(
                width / 2 - 130,
                height - 177
        );

        content.lineTo(
                width / 2 + 130,
                height - 177
        );

        content.stroke();
    }

    /**
     * Draws signed academic credential information.
     */
    private void drawStudentDetails(
            PDPageContentStream content,
            Credential credential,
            Student student,
            Map<String, Object> academicData,
            PDType1Font regular,
            PDType1Font bold,
            PDType1Font italic,
            float width,
            float height) throws IOException {

        String studentName =
                safeText(student.getUser().getFullName());

        String studentNumber =
                safeText(student.getStudentNumber());

        String degree = getAcademicValue(
                academicData,
                "degree",
                "course"
        );

        String course = getAcademicValue(
                academicData,
                "course",
                "degree"
        );

        String academicYear = getAcademicValue(
                academicData,
                "academicYear",
                null
        );

        float center = width / 2;

        drawCenteredText(
                content,
                "This is to certify that",
                italic,
                16,
                center,
                height - 215
        );

        drawCenteredText(
                content,
                studentName,
                bold,
                27,
                center,
                height - 258
        );

        drawCenteredText(
                content,
                "Student ID: " + studentNumber,
                regular,
                12,
                center,
                height - 281
        );

        drawCenteredText(
                content,
                "has successfully earned the academic credential",
                regular,
                15,
                center,
                height - 324
        );

        drawCenteredText(
                content,
                degree,
                bold,
                21,
                center,
                height - 358
        );

        if (!course.equalsIgnoreCase(degree)) {

            drawCenteredText(
                    content,
                    "Course: " + course,
                    regular,
                    13,
                    center,
                    height - 381
            );
        }

        if (!academicYear.isBlank()) {

            drawCenteredText(
                    content,
                    "Academic Year: " + academicYear,
                    regular,
                    13,
                    center,
                    height - 405
            );
        }

        // Optional details only when present in signed credential data.
        String grade = getAcademicValue(
                academicData,
                "grade",
                null
        );

        String cgpa = getAcademicValue(
                academicData,
                "cgpa",
                null
        );

        if (!grade.isBlank() || !cgpa.isBlank()) {

            StringBuilder additionalDetails =
                    new StringBuilder();

            if (!grade.isBlank()) {

                additionalDetails.append("Grade: ")
                        .append(grade);
            }

            if (!cgpa.isBlank()) {

                if (!additionalDetails.isEmpty()) {
                    additionalDetails.append("    ");
                }

                additionalDetails.append("CGPA: ")
                        .append(cgpa);
            }

            drawCenteredText(
                    content,
                    additionalDetails.toString(),
                    bold,
                    12,
                    center,
                    height - 430
            );
        }

        drawCenteredText(
                content,
                "Issued on "
                        + credential.getIssuedAt().format(DATE_FORMAT),
                regular,
                12,
                center,
                height - 454
        );
    }

    /**
     * Decorative hologram-style security seal.
     *
     * This is a visual design feature, not cryptographic proof.
     */
    private void drawSecuritySeal(
            PDPageContentStream content,
            float width,
            float height) throws IOException {

        float centerX = width - 105;
        float centerY = height - 125;

        setStrokeRgb(content, 170, 140, 55);
        content.setLineWidth(2);

        drawCircle(
                content,
                centerX,
                centerY,
                31
        );

        content.stroke();

        setStrokeRgb(content, 25, 55, 105);
        content.setLineWidth(1);

        drawCircle(
                content,
                centerX,
                centerY,
                25
        );

        content.stroke();

        PDType1Font sealFont = new PDType1Font(
                Standard14Fonts.FontName.HELVETICA_BOLD
        );

        drawCenteredText(
                content,
                "VERIFIED",
                sealFont,
                7,
                centerX,
                centerY + 2
        );

        drawCenteredText(
                content,
                "CREDIVAULT",
                sealFont,
                5,
                centerX,
                centerY - 9
        );
    }

    /**
     * Draws a circle using Bezier curves.
     */
    private void drawCircle(
            PDPageContentStream content,
            float centerX,
            float centerY,
            float radius) throws IOException {

        float k = 0.55228475f * radius;

        content.moveTo(
                centerX + radius,
                centerY
        );

        content.curveTo(
                centerX + radius,
                centerY + k,
                centerX + k,
                centerY + radius,
                centerX,
                centerY + radius
        );

        content.curveTo(
                centerX - k,
                centerY + radius,
                centerX - radius,
                centerY + k,
                centerX - radius,
                centerY
        );

        content.curveTo(
                centerX - radius,
                centerY - k,
                centerX - k,
                centerY - radius,
                centerX,
                centerY - radius
        );

        content.curveTo(
                centerX + k,
                centerY - radius,
                centerX + radius,
                centerY - k,
                centerX + radius,
                centerY
        );

        content.closePath();
    }

    /**
     * Generates and embeds the verification QR code.
     */
    private void drawQrCode(
            PDDocument document,
            PDPageContentStream content,
            String credentialCode,
            float width) throws IOException {

        byte[] qrBytes =
                qrCodeService.generateVerificationQr(
                        credentialCode
                );

        BufferedImage qrImage = ImageIO.read(
                new java.io.ByteArrayInputStream(qrBytes)
        );

        if (qrImage == null) {

            throw new IllegalStateException(
                    "Unable to create verification QR image"
            );
        }

        PDImageXObject qr =
                LosslessFactory.createFromImage(
                        document,
                        qrImage
                );

        content.drawImage(
                qr,
                width - 115,
                50,
                75,
                75
        );
    }

    /**
     * Draws the institutional signatory section.
     */
    private void drawSignatory(
            PDPageContentStream content,
            Institution institution,
            PDType1Font bold,
            PDType1Font regular,
            float width) throws IOException {

        float x = width / 2 - 45;

        setStrokeRgb(content, 70, 70, 70);
        content.setLineWidth(0.8f);

        content.moveTo(x - 65, 104);
        content.lineTo(x + 65, 104);
        content.stroke();

        drawCenteredText(
                content,
                institution.getSignatoryName(),
                bold,
                12,
                x,
                86
        );

        drawCenteredText(
                content,
                institution.getSignatoryDesignation(),
                regular,
                10,
                x,
                70
        );

        drawCenteredText(
                content,
                "Authorized Signatory",
                regular,
                8,
                x,
                56
        );
    }

    /**
     * Certificate footer.
     */
    private void drawFooter(
            PDPageContentStream content,
            Credential credential,
            PDType1Font regular,
            float width) throws IOException {

        String code =
                "Credential Code: "
                        + credential.getCredentialCode();

        drawText(
                content,
                code,
                regular,
                8,
                55,
                56
        );

        drawText(
                content,
                "Scan QR to verify authenticity",
                regular,
                7,
                width - 175,
                38
        );
    }

    /**
     * Draws centered text.
     */
    private void drawCenteredText(
            PDPageContentStream content,
            String text,
            PDType1Font font,
            float fontSize,
            float centerX,
            float y) throws IOException {

        if (text == null || text.isBlank()) {
            return;
        }

        text = safeText(text);

        float textWidth =
                font.getStringWidth(text) / 1000 * fontSize;

        float x = centerX - textWidth / 2;

        drawText(
                content,
                text,
                font,
                fontSize,
                x,
                y
        );
    }

    /**
     * Draws regular text.
     */
    private void drawText(
            PDPageContentStream content,
            String text,
            PDType1Font font,
            float fontSize,
            float x,
            float y) throws IOException {

        if (text == null || text.isBlank()) {
            return;
        }

        content.beginText();

        content.setFont(
                font,
                fontSize
        );

        content.newLineAtOffset(
                x,
                y
        );

        content.showText(
                safeText(text)
        );

        content.endText();
    }

    /**
     * Retrieves an academic value from signed credential data.
     */
    private String getAcademicValue(
            Map<String, Object> data,
            String primaryKey,
            String fallbackKey) {

        Object value = data.get(primaryKey);

        if (value == null && fallbackKey != null) {
            value = data.get(fallbackKey);
        }

        return value == null
                ? ""
                : safeText(value.toString());
    }

    /**
     * Makes text compatible with PDFBox Standard 14 fonts.
     */
    private String safeText(String value) {

        if (value == null) {
            return "";
        }

        return value
                .replace('\u2013', '-')
                .replace('\u2014', '-')
                .replace('\u2018', '\'')
                .replace('\u2019', '\'')
                .replace('\u201C', '"')
                .replace('\u201D', '"')
                .replaceAll("[^\\x20-\\x7E]", " ");
    }
}
