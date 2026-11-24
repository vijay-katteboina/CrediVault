CREATE TABLE institution_private_keys (
    institution_id BIGINT PRIMARY KEY,
    encrypted_key TEXT NOT NULL,
    iv VARCHAR(24) NOT NULL,
    key_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_institution_private_key_institution
        FOREIGN KEY (institution_id)
        REFERENCES institutions(institution_id)
        ON DELETE CASCADE
);
