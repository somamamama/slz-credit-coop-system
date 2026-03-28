-- Manual setup script for slz_coop_staff database
-- Copy and paste these commands one by one into your PostgreSQL client

-- 1. First, connect to the slz_coop_staff database
-- \c slz_coop_staff;

-- 2. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Create member_users table
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

-- 4. Create indexes for member_users
CREATE INDEX IF NOT EXISTS idx_member_users_email ON member_users(user_email);
CREATE INDEX IF NOT EXISTS idx_member_users_member_number ON member_users(member_number);
CREATE INDEX IF NOT EXISTS idx_member_users_active ON member_users(is_active);

-- 5. Create loan_applications table
CREATE TABLE IF NOT EXISTS loan_applications (
    application_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jpg_file_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES member_users(user_id) ON DELETE CASCADE
);

-- 6. Create indexes for loan_applications
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_submitted_at ON loan_applications(submitted_at);

-- 7. Create member accounts for your existing loan applications
-- Based on the user IDs from your loan_applications table

-- Member 1: bdec8498-2e81-4df2-be4e-7646a0510021
INSERT INTO member_users (user_id, user_name, user_email, user_password, member_number, is_active) 
VALUES (
    'bdec8498-2e81-4df2-be4e-7646a0510021', 
    'Member TST1003', 
    'tst1003@example.com', 
    '$2b$10$rLP.7EE/.JRbfwuuMbdteeFoBKCLfWQbgj9Y4Tnq.OItSGZRVQeE.', -- hashed 'password123'
    'TST1003', 
    true
);

-- Member 2: 9ac5b5ec-9cc6-4250-9a69-fcec659902cb  
INSERT INTO member_users (user_id, user_name, user_email, user_password, member_number, is_active) 
VALUES (
    '9ac5b5ec-9cc6-4250-9a69-fcec659902cb', 
    'Member TST1001', 
    'tst1001@example.com', 
    '$2b$10$WRMi09UB2Kq1TipiVkzDFOYecKbP1DIIP63AHJB0oGRiTJBqElua9u', -- hashed 'password123'
    'TST1001', 
    true
);

-- 8. Now migrate your existing loan applications
INSERT INTO loan_applications (user_id, application_date, jpg_file_path, status, submitted_at)
VALUES 
    ('bdec8498-2e81-4df2-be4e-7646a0510021', '2025-10-22 21:45:30.929336', 'loan_applications/loan_app_20251022_214530_3e8995e4.jpg', 'pending', '2025-10-22 21:45:30.929237'),
    ('9ac5b5ec-9cc6-4250-9a69-fcec659902cb', '2025-10-22 21:51:21.136964', 'loan_applications/loan_app_20251022_215121_e561936b.jpg', 'pending', '2025-10-22 21:51:21.136886'),
    ('9ac5b5ec-9cc6-4250-9a69-fcec659902cb', '2025-10-22 22:05:31.172371', 'loan_applications/loan_app_20251022_220531_a2c27ef7.jpg', 'pending', '2025-10-22 22:05:31.172279');

-- 9. Verify the setup
SELECT 'Setup completed!' as status;

SELECT 'Member Users:' as info;
SELECT user_name, user_email, member_number, is_active FROM member_users;

SELECT 'Loan Applications:' as info;
SELECT la.application_id, mu.user_name, mu.member_number, la.status, la.submitted_at 
FROM loan_applications la 
JOIN member_users mu ON la.user_id = mu.user_id 
ORDER BY la.submitted_at;

-- 10. Create trigger function (optional - for automatic updated_at timestamps)
-- You can skip this if you don't need automatic timestamps
/*
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_member_users_updated_at 
    BEFORE UPDATE ON member_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
*/
