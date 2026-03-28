-- Script to create a system user for staff operations and sync staff users
-- Run this in the slz_members database

-- First, create a system user for staff operations if it doesn't exist
INSERT INTO users (user_id, user_name, user_email, user_role, user_password)
VALUES (
    'system-staff-user',
    'System Staff User',
    'system@staffportal.local',
    'admin',
    '$2b$10$systemhash' -- This should be replaced with a proper hash if needed
) ON CONFLICT (user_id) DO NOTHING;

-- Alternative approach: Make reviewer_id nullable in loan_review_history
-- ALTER TABLE loan_review_history ALTER COLUMN reviewer_id DROP NOT NULL;

-- Add a comment explaining the system user
COMMENT ON TABLE users IS 'Users table includes both members and staff users for loan review operations';

-- Verify the system user was created
SELECT user_id, user_name, user_role FROM users WHERE user_id = 'system-staff-user';

-- Show current users to verify
SELECT user_id, user_name, user_role FROM users ORDER BY user_role, user_name;
