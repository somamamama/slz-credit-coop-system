-- Loan Applications Table Schema (PostgreSQL)
-- Drop existing table if needed
DROP TABLE IF EXISTS loan_applications;

-- Create loan_applications table
CREATE TABLE loan_applications (
    -- Primary key and metadata
    application_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    member_number VARCHAR(50),
    
    -- Application status and timestamps
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INTEGER NULL,
    
    -- Basic loan information
    date_filed DATE NOT NULL,
    loan_type VARCHAR(20) NOT NULL CHECK (loan_type IN ('quick', 'regular')),
    membership_type VARCHAR(20) NOT NULL CHECK (membership_type IN ('regular', 'associate')),
    
    -- Personal information
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    civil_status VARCHAR(20) NOT NULL CHECK (civil_status IN ('single', 'married', 'divorced', 'widowed')),
    birth_date DATE NOT NULL,
    
    -- Contact information
    landline VARCHAR(20),
    mobile_number VARCHAR(20) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    
    -- Address information
    current_address TEXT NOT NULL,
    years_of_stay_current DECIMAL(4,1) NOT NULL,
    permanent_address TEXT NOT NULL,
    years_of_stay_permanent DECIMAL(4,1) NOT NULL,
    home_ownership VARCHAR(50) NOT NULL CHECK (home_ownership IN (
        'owned_with_amortization',
        'owned_fully_paid',
        'owned_living_with_relatives',
        'renting'
    )),
    
    -- Family information
    spouse_name VARCHAR(255),
    number_of_children INTEGER DEFAULT 0,
    
    -- Employment information
    date_hired DATE,
    company_business VARCHAR(255),
    contract_period VARCHAR(100),
    designation_position VARCHAR(255),
    years_in_company DECIMAL(4,1),
    
    -- Document file paths
    gov_id_file_path VARCHAR(500),
    company_id_file_path VARCHAR(500),
    
    -- Additional notes and comments
    application_notes TEXT,
    reviewer_comments TEXT,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a trigger to automatically update the updated_at field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loan_applications_updated_at
    BEFORE UPDATE ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_loan_applications_loan_type ON loan_applications(loan_type);
CREATE INDEX idx_loan_applications_submitted_at ON loan_applications(submitted_at);
CREATE INDEX idx_loan_applications_member_number ON loan_applications(member_number);