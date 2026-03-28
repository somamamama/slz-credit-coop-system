-- Migration script to update loan_applications table structure
-- Run this script to ensure the table matches the form requirements

-- First, check if the table exists and what columns it has
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'loan_applications') THEN
        RAISE NOTICE 'loan_applications table exists. Checking structure...';
        
        -- Check if the table has the old structure (jpg_file_path column)
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'loan_applications' AND column_name = 'jpg_file_path') THEN
            RAISE NOTICE 'Old table structure detected. Backing up and recreating...';
            
            -- Create backup table
            DROP TABLE IF EXISTS loan_applications_backup;
            CREATE TABLE loan_applications_backup AS SELECT * FROM loan_applications;
            RAISE NOTICE 'Backup created as loan_applications_backup';
            
            -- Drop the old table
            DROP TABLE loan_applications CASCADE;
            RAISE NOTICE 'Old table dropped';
        ELSE
            RAISE NOTICE 'Table structure appears to be current';
        END IF;
    ELSE
        RAISE NOTICE 'loan_applications table does not exist. Will create new table.';
    END IF;
END
$$;

-- Create the new loan_applications table with the correct structure
CREATE TABLE IF NOT EXISTS loan_applications (
    -- Primary key and metadata
    application_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- Changed to UUID to match member_users table
    member_number VARCHAR(50),
    
    -- Application status and timestamps
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by UUID NULL, -- Changed to UUID for staff users
    
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints (if member_users table exists)
    CONSTRAINT fk_loan_applications_user_id 
        FOREIGN KEY (user_id) REFERENCES member_users(user_id) ON DELETE CASCADE
);

-- Create a trigger to automatically update the updated_at field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_loan_applications_updated_at ON loan_applications;

-- Create the trigger
CREATE TRIGGER update_loan_applications_updated_at
    BEFORE UPDATE ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_loan_type ON loan_applications(loan_type);
CREATE INDEX IF NOT EXISTS idx_loan_applications_submitted_at ON loan_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_loan_applications_member_number ON loan_applications(member_number);

-- Display final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'loan_applications' 
ORDER BY ordinal_position;

-- Show success message
SELECT 'loan_applications table migration completed successfully!' as status;