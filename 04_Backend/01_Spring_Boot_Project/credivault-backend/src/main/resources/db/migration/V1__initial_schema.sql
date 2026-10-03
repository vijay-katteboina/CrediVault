-- ============================================================
-- CrediVault - Initial Database Schema
-- Migration: V1
-- ============================================================

-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    account_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- ============================================================
-- 2. INSTITUTIONS
-- ============================================================

CREATE TABLE institutions (
    institution_id BIGSERIAL PRIMARY KEY,
    institution_name VARCHAR(200) NOT NULL,
    institution_code VARCHAR(50) UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- ============================================================
-- 3. STUDENTS
-- ============================================================

CREATE TABLE students (
    student_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    institution_id BIGINT NOT NULL,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    course VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_students_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_students_institution
        FOREIGN KEY (institution_id)
        REFERENCES institutions(institution_id)
);

-- ============================================================
-- 4. CREDENTIALS
-- ============================================================

CREATE TABLE credentials (
    credential_id BIGSERIAL PRIMARY KEY,
    credential_code VARCHAR(50) UNIQUE NOT NULL,
    student_id BIGINT NOT NULL,
    institution_id BIGINT NOT NULL,
    credential_type VARCHAR(100) NOT NULL,
    credential_data JSONB NOT NULL,
    data_hash VARCHAR(64) NOT NULL,
    digital_signature TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    issued_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_credentials_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    CONSTRAINT fk_credentials_institution
        FOREIGN KEY (institution_id)
        REFERENCES institutions(institution_id)
);

-- ============================================================
-- 5. REVOCATION RECORDS
-- ============================================================

CREATE TABLE revocation_records (
    revocation_id BIGSERIAL PRIMARY KEY,
    credential_id BIGINT NOT NULL,
    revoked_by BIGINT NOT NULL,
    reason VARCHAR(500) NOT NULL,
    revoked_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_revocation_credential
        FOREIGN KEY (credential_id)
        REFERENCES credentials(credential_id),

    CONSTRAINT fk_revocation_user
        FOREIGN KEY (revoked_by)
        REFERENCES users(user_id),

    CONSTRAINT uq_revocation_credential
        UNIQUE (credential_id)
);

-- ============================================================
-- 6. VERIFICATION LOGS
-- ============================================================

CREATE TABLE verification_logs (
    verification_id BIGSERIAL PRIMARY KEY,
    credential_id BIGINT NOT NULL,
    verifier_id BIGINT NOT NULL,
    result VARCHAR(30) NOT NULL,
    verification_time TIMESTAMP NOT NULL,
    verification_ip VARCHAR(45),

    CONSTRAINT fk_verification_credential
        FOREIGN KEY (credential_id)
        REFERENCES credentials(credential_id),

    CONSTRAINT fk_verification_verifier
        FOREIGN KEY (verifier_id)
        REFERENCES users(user_id)
);

-- ============================================================
-- 7. AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);