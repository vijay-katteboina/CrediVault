-- ============================================================
-- CrediVault - Public Verification Support
-- Migration: V3
-- Description: Allow anonymous credential verification logs
-- ============================================================

-- Allow verification records without an authenticated verifier.
-- Preserve the existing foreign key to users(user_id).

ALTER TABLE verification_logs
ALTER COLUMN verifier_id DROP NOT NULL;