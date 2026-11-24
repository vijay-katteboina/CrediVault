package com.credivault.dto;

import jakarta.validation.constraints.NotNull;

public class AdminUserInstitutionRequest {

    @NotNull
    private Long institutionId;

    public Long getInstitutionId() {
        return institutionId;
    }

    public void setInstitutionId(Long institutionId) {
        this.institutionId = institutionId;
    }
}
