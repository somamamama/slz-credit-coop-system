-- Migration script to add role-based authentication support

-- Payment references table to store member-submitted payment proofs for cashier confirmation
CREATE TABLE IF NOT EXISTS payment_references (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NULL,
    member_name VARCHAR(255) NULL,
    image_path TEXT NOT NULL,
    amount NUMERIC(12,2) NULL,
    reference_text VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending | confirmed | rejected
    confirmed_by INTEGER NULL,
    confirmed_by_name VARCHAR(255) NULL,
    confirmed_notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL
);
-- Run this in your PostgreSQL database (slz_coop_staff)

-- Add role and created_at columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) NOT NULL DEFAULT 'cashier',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Note: The passwords below are hashed using bcrypt with saltRounds=10
-- All test users have the password: password123

-- Insert test users with different roles (if they don't already exist)
INSERT INTO users (user_name, user_email, user_password, user_role) 
VALUES 
('Admin User', 'admin@creditcoop.com', '$2b$12$U3vHfNU1h22OG8nAqLqwoOx.BRAVAZ2XTJber9do/eJWPvWx4GZKq', 'admin'),
('Manager User', 'manager@creditcoop.com', '$2b$12$U3vHfNU1h22OG8nAqLqwoOx.BRAVAZ2XTJber9do/eJWPvWx4GZKq', 'manager'),
('Loan Officer', 'loanofficer@creditcoop.com', '$2b$12$U3vHfNU1h22OG8nAqLqwoOx.BRAVAZ2XTJber9do/eJWPvWx4GZKq', 'loan_officer'),
('Cashier User', 'cashier@creditcoop.com', '$2b$12$U3vHfNU1h22OG8nAqLqwoOx.BRAVAZ2XTJber9do/eJWPvWx4GZKq', 'cashier'),
('IT Admin', 'itadmin@creditcoop.com', '$2b$12$U3vHfNU1h22OG8nAqLqwoOx.BRAVAZ2XTJber9do/eJWPvWx4GZKq', 'it_admin')
ON CONFLICT (user_email) DO NOTHING;

-- Update existing users with default role if they don't have one
UPDATE users SET user_role = 'cashier' WHERE user_role IS NULL OR user_role = '';

-- Check the results
SELECT user_name, user_email, user_role, created_at FROM users ORDER BY created_at DESC;

INSERT INTO users (user_name, user_email, user_password, user_role) 
VALUES 
('Credit Investigator', 'creditinvestigator@creditcoop.com', '$2b$12$U3vHfNU1h22OG8nAqLqwoOx.BRAVAZ2XTJber9do/eJWPvWx4GZKq', 'credit_investigator')