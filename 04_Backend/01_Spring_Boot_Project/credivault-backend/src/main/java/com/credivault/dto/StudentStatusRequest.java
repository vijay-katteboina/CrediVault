package com.credivault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class StudentStatusRequest {

    @NotBlank
    @Pattern(
        regexp = "ACTIVE|INACTIVE",
        flags = Pattern.Flag.CASE_INSENSITIVE
    )
    private String accountStatus;

    public StudentStatusRequest() {
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }
}