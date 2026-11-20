package com.credivault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class AdminInstitutionStatusRequest {

    @NotBlank
    @Pattern(
            regexp = "ACTIVE|INACTIVE",
            flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "Status must be ACTIVE or INACTIVE"
    )
    private String status;

    public AdminInstitutionStatusRequest() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}