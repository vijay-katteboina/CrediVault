package com.credivault.dto;

public class AdminInstitutionRegistrationResponse {

    private AdminInstitutionResponse institution;

    public AdminInstitutionRegistrationResponse(AdminInstitutionResponse institution) {
        this.institution = institution;
    }

    public AdminInstitutionResponse getInstitution() {
        return institution;
    }
}
