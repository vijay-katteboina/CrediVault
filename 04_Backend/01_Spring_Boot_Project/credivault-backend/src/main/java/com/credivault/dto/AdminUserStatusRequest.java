package com.credivault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class AdminUserStatusRequest {

    @NotBlank
    @Pattern(
            regexp = "ACTIVE|INACTIVE",
            flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "Status must be ACTIVE or INACTIVE"
    )
    private String accountStatus;

    public AdminUserStatusRequest() {
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }
}