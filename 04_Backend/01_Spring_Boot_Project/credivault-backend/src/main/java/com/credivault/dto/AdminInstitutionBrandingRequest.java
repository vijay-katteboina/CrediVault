package com.credivault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AdminInstitutionBrandingRequest {

    @NotBlank(message = "Institution address is required")
    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String institutionAddress;

    @NotBlank(message = "Signatory name is required")
    @Size(max = 150, message = "Signatory name cannot exceed 150 characters")
    private String signatoryName;

    @NotBlank(message = "Signatory designation is required")
    @Size(max = 150, message = "Designation cannot exceed 150 characters")
    private String signatoryDesignation;

    public String getInstitutionAddress() {
        return institutionAddress;
    }

    public void setInstitutionAddress(String institutionAddress) {
        this.institutionAddress = institutionAddress;
    }

    public String getSignatoryName() {
        return signatoryName;
    }

    public void setSignatoryName(String signatoryName) {
        this.signatoryName = signatoryName;
    }

    public String getSignatoryDesignation() {
        return signatoryDesignation;
    }

    public void setSignatoryDesignation(String signatoryDesignation) {
        this.signatoryDesignation = signatoryDesignation;
    }
}