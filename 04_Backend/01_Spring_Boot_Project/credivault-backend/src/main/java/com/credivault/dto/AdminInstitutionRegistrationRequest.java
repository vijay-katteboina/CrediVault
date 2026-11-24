package com.credivault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;

public class AdminInstitutionRegistrationRequest {

    @NotBlank
    @Size(max = 200)
    private String institutionName;

    @NotBlank
    @Size(min = 3, max = 30)
    @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "Institution code may contain letters, numbers, and hyphens")
    private String institutionCode;

    @NotBlank
    @Size(max = 500)
    private String institutionAddress;

    @NotBlank
    @Size(max = 150)
    private String signatoryName;

    @NotBlank
    @Size(max = 150)
    private String signatoryDesignation;

    @NotBlank
    @Email
    @Size(max = 150)
    private String loginEmail;

    @NotBlank
    @Size(min = 12, max = 255)
    private String loginPassword;

    public String getInstitutionName() { return institutionName; }
    public void setInstitutionName(String institutionName) { this.institutionName = institutionName; }
    public String getInstitutionCode() { return institutionCode; }
    public void setInstitutionCode(String institutionCode) { this.institutionCode = institutionCode; }
    public String getInstitutionAddress() { return institutionAddress; }
    public void setInstitutionAddress(String institutionAddress) { this.institutionAddress = institutionAddress; }
    public String getSignatoryName() { return signatoryName; }
    public void setSignatoryName(String signatoryName) { this.signatoryName = signatoryName; }
    public String getSignatoryDesignation() { return signatoryDesignation; }
    public void setSignatoryDesignation(String signatoryDesignation) { this.signatoryDesignation = signatoryDesignation; }
    public String getLoginEmail() { return loginEmail; }
    public void setLoginEmail(String loginEmail) { this.loginEmail = loginEmail; }
    public String getLoginPassword() { return loginPassword; }
    public void setLoginPassword(String loginPassword) { this.loginPassword = loginPassword; }
}
