-- Link users to the institution they represent.
ALTER TABLE users
ADD COLUMN institution_id BIGINT;

-- Ensure that the referenced institution exists.
ALTER TABLE users
ADD CONSTRAINT fk_users_institution
FOREIGN KEY (institution_id)
REFERENCES institutions(institution_id);

-- Improve queries that filter users by institution.
CREATE INDEX idx_users_institution_id
ON users(institution_id);