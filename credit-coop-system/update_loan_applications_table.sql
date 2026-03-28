-- Update loan_applications table to support comprehensive loan application form
-- This script will drop the existing table and recreate it with all required fields

DROP TABLE IF EXISTS loan_applications CASCADE;

CREATE TABLE loan_applications (
    application_id SERIAL PRIMARY KEY,
    user_id UUID,
    
    -- Application metadata
    date_filed DATE,
    loan_type VARCHAR(100),
    membership_type VARCHAR(50),
    
    -- Personal Information
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    gender VARCHAR(20),
    civil_status VARCHAR(50),
    birth_date DATE,
    
    -- Contact Information
    landline VARCHAR(20),
    mobile_number VARCHAR(20),
    email_address VARCHAR(255),
    
    -- Address Information
    current_address TEXT,
    years_of_stay_current INTEGER,
    permanent_address TEXT,
    years_of_stay_permanent INTEGER,
    home_ownership VARCHAR(50),
    
    -- Family Information
    spouse_name VARCHAR(200),
    number_of_children INTEGER,
    
    -- Employment Information
    date_hired DATE,
    company_business TEXT,
    contract_period VARCHAR(100),
    designation_position VARCHAR(100),
    years_in_company INTEGER,
    
    -- File uploads
    gov_id_file_path VARCHAR(500),
    company_id_file_path VARCHAR(500),
    
    -- Application status and timestamps
    status VARCHAR(50) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_status CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled')),
    CONSTRAINT chk_gender CHECK (gender IN ('Male', 'Female', 'Other')),
    CONSTRAINT chk_civil_status CHECK (civil_status IN ('Single', 'Married', 'Divorced', 'Widowed', 'Separated'))
);

-- Create indexes for better performance
CREATE INDEX idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_loan_applications_submitted_at ON loan_applications(submitted_at);
CREATE INDEX idx_loan_applications_loan_type ON loan_applications(loan_type);
CREATE INDEX idx_loan_applications_last_name ON loan_applications(last_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_loan_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_loan_applications_updated_at
    BEFORE UPDATE ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_loan_applications_updated_at();

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON loan_applications TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE loan_applications_application_id_seq TO your_app_user;