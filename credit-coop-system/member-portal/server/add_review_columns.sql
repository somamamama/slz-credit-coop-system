-- Script to add review columns to existing loan_applications table
-- Run this if you already have a loan_applications table and need to add review columns

-- Add review columns to loan_applications table
ALTER TABLE loan_applications 
ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS loan_officer_id UUID,
ADD COLUMN IF NOT EXISTS manager_id UUID,
ADD COLUMN IF NOT EXISTS loan_officer_notes TEXT,
ADD COLUMN IF NOT EXISTS manager_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS loan_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS loan_term_months INTEGER,
ADD COLUMN IF NOT EXISTS loan_purpose VARCHAR(255),
ADD COLUMN IF NOT EXISTS credit_score INTEGER,
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(100),
ADD COLUMN IF NOT EXISTS collateral_description TEXT,
ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'medium';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_loan_applications_review_status ON loan_applications(review_status);

-- Create loan_review_history table if it doesn't exist
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

-- Update existing applications to have pending review status
UPDATE loan_applications 
SET review_status = 'pending' 
WHERE review_status IS NULL;

SELECT 'Review columns added to loan_applications table successfully!' as status;
