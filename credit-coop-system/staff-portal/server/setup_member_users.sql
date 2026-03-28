-- SQL script to create member_users table for member account management
-- Run this script in your PostgreSQL database (slz_members)

-- Create the member_users table with proper schema
CREATE TABLE IF NOT EXISTS member_users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    member_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_users_email ON member_users(user_email);
CREATE INDEX IF NOT EXISTS idx_member_users_member_number ON member_users(member_number);
CREATE INDEX IF NOT EXISTS idx_member_users_active ON member_users(is_active);

-- Add comments to the table and columns
COMMENT ON TABLE member_users IS 'Stores member user accounts for login to member portal';
COMMENT ON COLUMN member_users.user_id IS 'Unique identifier for the member user';
COMMENT ON COLUMN member_users.user_name IS 'Full name of the member';
COMMENT ON COLUMN member_users.user_email IS 'Email address used for login';
COMMENT ON COLUMN member_users.user_password IS 'Hashed password for authentication';
COMMENT ON COLUMN member_users.member_number IS 'Unique member number/ID';
COMMENT ON COLUMN member_users.created_at IS 'Timestamp when the account was created';
COMMENT ON COLUMN member_users.updated_at IS 'Timestamp when the account was last updated';
COMMENT ON COLUMN member_users.is_active IS 'Whether the account is active or disabled';

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_member_users_updated_at 
    BEFORE UPDATE ON member_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created successfully
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'member_users' 
ORDER BY ordinal_position;
