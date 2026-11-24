package com.credivault.controller;

import com.credivault.dto.WalletResponse;
import com.credivault.service.StudentService;

import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    /**
     * Returns the authenticated student's credential wallet.
     */
    @GetMapping("/wallet")
    public ResponseEntity<WalletResponse> getWallet(
            Authentication authentication) {

        String email = authentication.getName();

        WalletResponse response =
                studentService.getWallet(email);

        return ResponseEntity.ok(response);
    }

    /**
     * Downloads a certificate only when it belongs to the
     * currently authenticated student.
     */
    @GetMapping(
            value = "/credentials/{credentialId}/certificate",
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> downloadCertificate(
            @PathVariable Long credentialId,
            Authentication authentication) {

        byte[] pdf = studentService.downloadCertificate(
                credentialId,
                authentication.getName()
        );

        String fileName = "CrediVault-Certificate-" +
                credentialId + ".pdf";

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename(fileName)
                        .build()
        );
        headers.setCacheControl(CacheControl.noStore());

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(pdf.length)
                .body(pdf);
    }
}
