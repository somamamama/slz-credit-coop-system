-- Enhanced loan applications table with review workflow
-- This extends the existing loan_applications table with review fields

-- Add review workflow columns to existing loan_applications table
ALTER TABLE loan_applications 
ADD COLUMN IF NOT EXISTS loan_officer_id UUID,
ADD COLUMN IF NOT EXISTS manager_id UUID,
ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'pending_review',
ADD COLUMN IF NOT EXISTS loan_officer_notes TEXT,
ADD COLUMN IF NOT EXISTS manager_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS loan_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS loan_term_months INTEGER,
ADD COLUMN IF NOT EXISTS loan_purpose TEXT,
ADD COLUMN IF NOT EXISTS credit_score INTEGER,
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(100),
ADD COLUMN IF NOT EXISTS collateral_description TEXT,
ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'medium';

-- Create loan_review_history table to track review actions
CREATE TABLE IF NOT EXISTS loan_review_history (
    history_id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    reviewer_id UUID NOT NULL,
    reviewer_role VARCHAR(50) NOT NULL,
    action_taken VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES loan_applications(application_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loan_applications_review_status ON loan_applications(review_status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_loan_officer ON loan_applications(loan_officer_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_manager ON loan_applications(manager_id);
CREATE INDEX IF NOT EXISTS idx_loan_review_history_application ON loan_review_history(application_id);
CREATE INDEX IF NOT EXISTS idx_loan_review_history_reviewer ON loan_review_history(reviewer_id);

-- Add comments to new columns
COMMENT ON COLUMN loan_applications.loan_officer_id IS 'ID of the loan officer assigned to review this application';
COMMENT ON COLUMN loan_applications.manager_id IS 'ID of the manager who approved/rejected this application';
COMMENT ON COLUMN loan_applications.review_status IS 'Current review status: pending_review, under_review, approved, rejected, returned';
COMMENT ON COLUMN loan_applications.loan_officer_notes IS 'Notes from the loan officer during review';
COMMENT ON COLUMN loan_applications.manager_notes IS 'Notes from the manager during approval/rejection';
COMMENT ON COLUMN loan_applications.reviewed_at IS 'Timestamp when loan officer completed review';
COMMENT ON COLUMN loan_applications.approved_at IS 'Timestamp when manager approved the application';
COMMENT ON COLUMN loan_applications.rejected_at IS 'Timestamp when manager rejected the application';
COMMENT ON COLUMN loan_applications.loan_amount IS 'Requested loan amount';
COMMENT ON COLUMN loan_applications.interest_rate IS 'Proposed interest rate';
COMMENT ON COLUMN loan_applications.loan_term_months IS 'Loan term in months';
COMMENT ON COLUMN loan_applications.loan_purpose IS 'Purpose of the loan';
COMMENT ON COLUMN loan_applications.credit_score IS 'Applicant credit score';
COMMENT ON COLUMN loan_applications.monthly_income IS 'Applicant monthly income';
COMMENT ON COLUMN loan_applications.employment_status IS 'Applicant employment status';
COMMENT ON COLUMN loan_applications.collateral_description IS 'Description of collateral provided';
COMMENT ON COLUMN loan_applications.priority_level IS 'Priority level: low, medium, high, urgent';

-- Update existing applications with default values
UPDATE loan_applications 
SET review_status = 'pending_review',
    priority_level = 'medium'
WHERE review_status IS NULL;

-- Verify the schema
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('loan_applications', 'loan_review_history')
ORDER BY table_name, ordinal_position;
