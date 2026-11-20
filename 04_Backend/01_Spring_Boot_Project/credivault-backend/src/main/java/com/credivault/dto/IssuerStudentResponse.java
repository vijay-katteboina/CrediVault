package com.credivault.dto;

public class IssuerStudentResponse {

    private Long studentId;
    private String studentNumber;
    private String fullName;
    private String email;
    private String course;
    private String academicYear;
    private String accountStatus;

    public IssuerStudentResponse() {
    }

    public IssuerStudentResponse(
            Long studentId,
            String studentNumber,
            String fullName,
            String email,
            String course,
            String academicYear,
            String accountStatus) {

        this.studentId = studentId;
        this.studentNumber = studentNumber;
        this.fullName = fullName;
        this.email = email;
        this.course = course;
        this.academicYear = academicYear;
        this.accountStatus = accountStatus;
    }

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

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }
}