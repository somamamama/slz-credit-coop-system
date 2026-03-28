-- Simple setup script for the slz_coop_staff database
-- Run this with: psql -U postgres -d slz_coop_staff -f simple_setup.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create member_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS member_users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(255),
    user_email VARCHAR(255) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    member_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_users_email ON member_users(user_email);
CREATE INDEX IF NOT EXISTS idx_member_users_member_number ON member_users(member_number);
CREATE INDEX IF NOT EXISTS idx_member_users_active ON member_users(is_active);

-- Create loan_applications table
CREATE TABLE IF NOT EXISTS loan_applications (
    application_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jpg_file_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES member_users(user_id) ON DELETE CASCADE
);

-- Create indexes for loan_applications
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_submitted_at ON loan_applications(submitted_at);

-- Simple trigger function (avoiding dollar quotes)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql AS
'
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
';

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_member_users_updated_at ON member_users;
CREATE TRIGGER update_member_users_updated_at 
    BEFORE UPDATE ON member_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Display success message
SELECT 'Database setup completed successfully!' as status;

-- Show table structure
\d+ member_users;
\d+ loan_applications;

-- Show current record counts
SELECT 'member_users' as table_name, COUNT(*) as record_count FROM member_users
UNION ALL
SELECT 'loan_applications' as table_name, COUNT(*) as record_count FROM loan_applications;
