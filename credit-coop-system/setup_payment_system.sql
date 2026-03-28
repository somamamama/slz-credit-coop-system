-- Payment System Database Setup
-- This script creates the payment_references table with proper foreign key relationships
-- Run this on the slz_coop_staff database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing payment_references table if it exists (to recreate with proper structure)
DROP TABLE IF EXISTS payment_references CASCADE;

-- Create payment_references table with proper foreign key to member_users
CREATE TABLE payment_references (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,                          -- Foreign key to member_users.user_id
    image_path VARCHAR(500) NOT NULL,               -- Path to uploaded payment reference image
    amount DECIMAL(10,2),                           -- Payment amount (optional)
    reference_text VARCHAR(255),                    -- Extracted/typed reference number
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    
    -- Confirmation details (filled when staff processes the payment)
    confirmed_by UUID,                              -- Staff member who confirmed (could reference staff table)
    confirmed_by_name VARCHAR(255),                 -- Name of confirming staff member
    confirmed_notes TEXT,                           -- Notes from staff
    confirmed_at TIMESTAMP,                         -- When payment was confirmed/rejected
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_payment_user 
        FOREIGN KEY (user_id) REFERENCES member_users(user_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_payment_references_user_id ON payment_references(user_id);
CREATE INDEX idx_payment_references_status ON payment_references(status);
CREATE INDEX idx_payment_references_created_at ON payment_references(created_at);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_references_updated_at 
    BEFORE UPDATE ON payment_references 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE payment_references IS 'Stores payment reference submissions from members';
COMMENT ON COLUMN payment_references.id IS 'Unique identifier for the payment reference';
COMMENT ON COLUMN payment_references.user_id IS 'References member_users.user_id';
COMMENT ON COLUMN payment_references.image_path IS 'Path to the uploaded payment reference image';
COMMENT ON COLUMN payment_references.amount IS 'Payment amount if provided';
COMMENT ON COLUMN payment_references.reference_text IS 'Reference number extracted from image or typed by user';
COMMENT ON COLUMN payment_references.status IS 'Current status: pending, confirmed, or rejected';
COMMENT ON COLUMN payment_references.confirmed_by IS 'Staff member who confirmed the payment';
COMMENT ON COLUMN payment_references.confirmed_by_name IS 'Name of the confirming staff member';
COMMENT ON COLUMN payment_references.confirmed_notes IS 'Notes from staff about the payment';
COMMENT ON COLUMN payment_references.confirmed_at IS 'Timestamp when payment was processed';

-- Insert some sample data for testing (optional)
-- You can uncomment these lines if you want test data

-- Sample member users (if they don't exist)
/*
INSERT INTO member_users (user_id, user_name, user_email, user_password, member_number, is_active) 
VALUES 
    (uuid_generate_v4(), 'John Doe', 'john@example.com', '$2b$10$hash', 'MEM001', true),
    (uuid_generate_v4(), 'Jane Smith', 'jane@example.com', '$2b$10$hash', 'MEM002', true)
ON CONFLICT (user_email) DO NOTHING;
*/

SELECT 'Payment system database setup completed successfully!' as message;
