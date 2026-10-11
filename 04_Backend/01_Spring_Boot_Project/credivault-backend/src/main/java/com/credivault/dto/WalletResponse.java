package com.credivault.dto;

import java.util.List;

public class WalletResponse {

    private Long studentId;
    private String studentNumber;
    private String fullName;
    private String email;
    private String course;
    private String academicYear;
    private String institutionName;
    private List<WalletCredentialResponse> credentials;

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public void setStudentNumber(String studentNumber) {
        this.studentNumber = studentNumber;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public void setInstitutionName(String institutionName) {
        this.institutionName = institutionName;
    }

    public List<WalletCredentialResponse> getCredentials() {
        return credentials;
    }

    public void setCredentials(List<WalletCredentialResponse> credentials) {
        this.credentials = credentials;
    }
}