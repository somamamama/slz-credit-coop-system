-- Create membership applications table
CREATE TABLE IF NOT EXISTS membership_applications (
    application_id SERIAL PRIMARY KEY,
    
    -- Basic membership information
    number_of_shares INTEGER,
    amount_subscribe DECIMAL(15,2),
    application_date DATE,
    membership_type VARCHAR(50),
    applicants_membership_number VARCHAR(100),
    
    -- Personal information
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    suffix VARCHAR(20),
    address TEXT NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    type_of_address VARCHAR(50),
    occupied_since DATE,
    email_address VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    place_of_birth VARCHAR(200),
    religion VARCHAR(100),
    age INTEGER,
    gender VARCHAR(20),
    civil_status VARCHAR(50),
    highest_educational_attainment VARCHAR(100),
    
    -- Family information
    spouse_full_name VARCHAR(200),
    fathers_full_name VARCHAR(200),
    mothers_maiden_name VARCHAR(200),
    number_of_dependents INTEGER,
    
    -- Professional information
    occupation VARCHAR(200),
    annual_income DECIMAL(15,2),
    tax_identification_number VARCHAR(50),
    identification_type VARCHAR(50),
    identification_number VARCHAR(100),
    employment_choice VARCHAR(50),
    
    -- Self employed information
    business_type VARCHAR(200),
    business_address TEXT,
    
    -- Employment information
    employer_trade_name VARCHAR(200),
    employer_tin_number VARCHAR(50),
    employer_phone_number VARCHAR(20),
    date_hired_from DATE,
    date_hired_to DATE,
    employment_occupation VARCHAR(200),
    employment_occupation_status VARCHAR(50),
    annual_monthly_indicator VARCHAR(20),
    employment_industry VARCHAR(200),
    
    -- Social and reference information
    facebook_account VARCHAR(255),
    reference_person VARCHAR(200),
    reference_address TEXT,
    reference_contact_number VARCHAR(20),
    
    -- File and status information
    profile_image_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending',
    review_notes TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_membership_applications_status ON membership_applications(status);
CREATE INDEX IF NOT EXISTS idx_membership_applications_created_at ON membership_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_membership_applications_email ON membership_applications(email_address);