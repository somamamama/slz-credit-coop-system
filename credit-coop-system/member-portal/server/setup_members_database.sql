-- Setup script for the staff database (slz_coop_staff)
-- This script ensures all required tables exist for the loan application system

-- Connect to the slz_coop_staff database first:
-- \c slz_coop_staff;

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
    
    -- Review fields
    review_status VARCHAR(50) DEFAULT 'pending',
    loan_officer_id UUID,
    manager_id UUID,
    loan_officer_notes TEXT,
    manager_notes TEXT,
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    
    -- Loan details (filled during review)
    loan_amount DECIMAL(15,2),
    interest_rate DECIMAL(5,2),
    loan_term_months INTEGER,
    loan_purpose VARCHAR(255),
    
    -- Credit assessment
    credit_score INTEGER,
    monthly_income DECIMAL(15,2),
    employment_status VARCHAR(100),
    collateral_description TEXT,
    priority_level VARCHAR(20) DEFAULT 'medium',
    
    FOREIGN KEY (user_id) REFERENCES member_users(user_id) ON DELETE CASCADE
);

-- Create indexes for loan_applications
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_review_status ON loan_applications(review_status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_submitted_at ON loan_applications(submitted_at);

-- Create loan_review_history table
CREATE TABLE IF NOT EXISTS loan_review_history (
    history_id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    reviewer_id UUID,
    reviewer_role VARCHAR(50),
    action_taken VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES loan_applications(application_id) ON DELETE CASCADE
);

-- Create indexes for loan_review_history
CREATE INDEX IF NOT EXISTS idx_loan_review_history_application_id ON loan_review_history(application_id);
CREATE INDEX IF NOT EXISTS idx_loan_review_history_created_at ON loan_review_history(created_at);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $trigger_function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$trigger_function$ language 'plpgsql';

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_member_users_updated_at ON member_users;
CREATE TRIGGER update_member_users_updated_at 
    BEFORE UPDATE ON member_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to tables and columns
COMMENT ON TABLE member_users IS 'Stores member user accounts for the credit cooperative system';
COMMENT ON COLUMN member_users.user_id IS 'Unique identifier for the member user';
COMMENT ON COLUMN member_users.user_name IS 'Full name of the member (optional)';
COMMENT ON COLUMN member_users.user_email IS 'Email address used for login';
COMMENT ON COLUMN member_users.user_password IS 'Hashed password for authentication';
COMMENT ON COLUMN member_users.member_number IS 'Unique member number/ID';
COMMENT ON COLUMN member_users.created_at IS 'Timestamp when the account was created';
COMMENT ON COLUMN member_users.updated_at IS 'Timestamp when the account was last updated';
COMMENT ON COLUMN member_users.is_active IS 'Whether the account is active or disabled';

COMMENT ON TABLE loan_applications IS 'Stores loan applications submitted by members';
COMMENT ON COLUMN loan_applications.application_id IS 'Unique identifier for the loan application';
COMMENT ON COLUMN loan_applications.user_id IS 'Reference to the member who submitted the application';
COMMENT ON COLUMN loan_applications.application_date IS 'Date when the application was created';
COMMENT ON COLUMN loan_applications.jpg_file_path IS 'Path to the uploaded JPG application file';
COMMENT ON COLUMN loan_applications.status IS 'Current status: pending, approved, rejected';
COMMENT ON COLUMN loan_applications.submitted_at IS 'Timestamp when the application was submitted';

-- Display table information
SELECT 
    'member_users' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'member_users' 
ORDER BY ordinal_position;

SELECT 
    'loan_applications' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'loan_applications' 
ORDER BY ordinal_position;

-- Show table counts
SELECT 'member_users' as table_name, COUNT(*) as record_count FROM member_users
UNION ALL
SELECT 'loan_applications' as table_name, COUNT(*) as record_count FROM loan_applications;

-- Success message
SELECT 'Staff database setup completed successfully!' as status;
