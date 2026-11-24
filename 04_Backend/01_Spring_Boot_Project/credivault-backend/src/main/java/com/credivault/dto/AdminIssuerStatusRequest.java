package com.credivault.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;

public class AdminIssuerStatusRequest {

    @NotBlank
    @Pattern(
            regexp = "ACTIVE|INACTIVE",
            flags = Pattern.Flag.CASE_INSENSITIVE
    )
    private String accountStatus;

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }
}
