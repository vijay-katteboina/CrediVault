package com.credivault.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

@Service
public class InstitutionLogoStorageService {

    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024;

    private final Path logoDirectory;

    public InstitutionLogoStorageService(
            @Value("${credivault.storage.directory:./credivault-storage}")
            String storageDirectory) {

        this.logoDirectory = Path.of(storageDirectory)
                .toAbsolutePath()
                .normalize()
                .resolve("institution-logos");
    }

    public String storeLogo(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select an institution logo"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Logo size must not exceed 2 MB"
            );
        }

        try {
            byte[] imageBytes = file.getBytes();

            BufferedImage image = ImageIO.read(
                    new ByteArrayInputStream(imageBytes)
            );

            if (image == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid image file"
                );
            }

            String extension = detectImageExtension(imageBytes);

            if (extension == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Only PNG and JPEG images are supported"
                );
            }

            if (image.getWidth() > 4000 || image.getHeight() > 4000) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Image dimensions must not exceed 4000 x 4000"
                );
            }

            Files.createDirectories(logoDirectory);

            String fileName = UUID.randomUUID() + "." + extension;

            Path destination = logoDirectory.resolve(fileName)
                    .normalize();

            if (!destination.startsWith(logoDirectory)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid file path"
                );
            }

            Files.write(
                    destination,
                    imageBytes,
                    StandardOpenOption.CREATE_NEW,
                    StandardOpenOption.WRITE
            );

            return "institution-logos/" + fileName;

        } catch (IOException exception) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to store institution logo"
            );
        }
    }

    private String detectImageExtension(byte[] bytes) {

        // PNG signature
        if (bytes.length >= 8
                && (bytes[0] & 0xFF) == 0x89
                && bytes[1] == 0x50
                && bytes[2] == 0x4E
                && bytes[3] == 0x47
                && bytes[4] == 0x0D
                && bytes[5] == 0x0A
                && bytes[6] == 0x1A
                && bytes[7] == 0x0A) {

            return "png";
        }

        // JPEG signature
        if (bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF) {

            return "jpg";
        }

        return null;
    }
}