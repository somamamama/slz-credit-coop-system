-- SQL script to set up the loan_applications table
-- Run this script in your PostgreSQL database (slz_members)

-- Create the loan_applications table
CREATE TABLE IF NOT EXISTS loan_applications (
    application_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jpg_file_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create an index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);

-- Create an index on status for filtering applications by status
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);

-- Create an index on submitted_at for sorting by submission date
CREATE INDEX IF NOT EXISTS idx_loan_applications_submitted_at ON loan_applications(submitted_at);

-- Add a comment to the table
COMMENT ON TABLE loan_applications IS 'Stores loan applications submitted by members with JPG file attachments';

-- Add comments to columns
COMMENT ON COLUMN loan_applications.application_id IS 'Unique identifier for the loan application';
COMMENT ON COLUMN loan_applications.user_id IS 'Foreign key referencing the member who submitted the application';
COMMENT ON COLUMN loan_applications.application_date IS 'Date when the application was submitted';
COMMENT ON COLUMN loan_applications.jpg_file_path IS 'Path to the uploaded JPG file';
COMMENT ON COLUMN loan_applications.status IS 'Current status of the application (pending, approved, rejected)';
COMMENT ON COLUMN loan_applications.submitted_at IS 'Timestamp when the application was submitted';

-- Verify the table was created successfully
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'loan_applications' 
ORDER BY ordinal_position;
