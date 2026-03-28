-- Drop existing loan_applications table if it exists
DROP TABLE IF EXISTS loan_applications;

-- Create comprehensive loan_applications table
CREATE TABLE loan_applications (
    -- Primary key and metadata
    application_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    member_number VARCHAR(50),
    
    -- Application status and timestamps
    status ENUM('pending', 'under_review', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL,
    
    -- Basic loan information
    date_filed DATE NOT NULL,
    loan_type ENUM('quick', 'regular') NOT NULL,
    membership_type ENUM('regular', 'associate') NOT NULL,
    
    -- Personal information
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    gender ENUM('male', 'female', 'other') NOT NULL,
    civil_status ENUM('single', 'married', 'divorced', 'widowed') NOT NULL,
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
    home_ownership ENUM(
        'owned_with_amortization',
        'owned_fully_paid',
        'owned_living_with_relatives',
        'renting'
    ) NOT NULL,
    
    -- Family information
    spouse_name VARCHAR(255),
    number_of_children INT DEFAULT 0,
    
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES members(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES staff_users(user_id) ON DELETE SET NULL,
    
    -- Indexes for better performance
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_loan_type (loan_type),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_member_number (member_number)
);

-- Add some useful views for reporting
CREATE VIEW loan_applications_summary AS
SELECT 
    application_id,
    user_id,
    member_number,
    CONCAT(first_name, ' ', last_name) AS full_name,
    loan_type,
    membership_type,
    status,
    submitted_at,
    reviewed_at,
    DATEDIFF(COALESCE(reviewed_at, NOW()), submitted_at) AS days_pending
FROM loan_applications;

-- Create view for pending applications
CREATE VIEW pending_loan_applications AS
SELECT 
    la.*,
    m.email AS member_email,
    m.phone AS member_phone
FROM loan_applications la
LEFT JOIN members m ON la.user_id = m.user_id
WHERE la.status = 'pending'
ORDER BY la.submitted_at ASC;

-- Add triggers for audit logging (optional)
DELIMITER //

CREATE TRIGGER loan_applications_status_log
AFTER UPDATE ON loan_applications
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO loan_application_status_log (
            application_id,
            old_status,
            new_status,
            changed_by,
            changed_at
        ) VALUES (
            NEW.application_id,
            OLD.status,
            NEW.status,
            NEW.reviewed_by,
            NOW()
        );
    END IF;
END//

DELIMITER ;

-- Create status log table for audit trail
CREATE TABLE loan_application_status_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES loan_applications(application_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES staff_users(user_id) ON DELETE SET NULL
);

-- Insert sample data (optional - remove in production)
-- INSERT INTO loan_applications (
--     user_id, date_filed, loan_type, membership_type, last_name, first_name,
--     gender, civil_status, birth_date, mobile_number, email_address,
--     current_address, years_of_stay_current, permanent_address, years_of_stay_permanent,
--     home_ownership
-- ) VALUES (
--     1, '2025-10-29', 'regular', 'regular', 'Doe', 'John',
--     'male', 'married', '1990-01-15', '09123456789', 'john.doe@example.com',
--     '123 Main St, Batangas City', 5.0, '123 Main St, Batangas City', 10.0,
--     'owned_fully_paid'
-- );