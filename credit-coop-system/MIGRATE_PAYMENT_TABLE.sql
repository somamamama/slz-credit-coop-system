-- Payment References Table Migration
-- This script updates the payment_references table to work with the new system
-- Run this in your PostgreSQL database (slz_coop_staff)

-- Step 1: Check current table structure
SELECT 'Current table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_references' 
ORDER BY ordinal_position;

-- Step 2: Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_references' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE payment_references ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column';
    ELSE
        RAISE NOTICE 'user_id column already exists';
    END IF;
END $$;

-- Step 3: Migrate data if member_id exists and contains valid UUIDs
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_references' AND column_name = 'member_id'
    ) THEN
        -- Try to migrate member_id data to user_id if it looks like UUID
        UPDATE payment_references 
        SET user_id = CASE 
            WHEN member_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN member_id::UUID
            ELSE NULL
        END
        WHERE user_id IS NULL;
        
        RAISE NOTICE 'Migrated member_id data to user_id';
    END IF;
END $$;

-- Step 4: Create foreign key constraint (only if member_users table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'member_users'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payment_user'
    ) THEN
        ALTER TABLE payment_references 
        ADD CONSTRAINT fk_payment_user 
        FOREIGN KEY (user_id) REFERENCES member_users(user_id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists or member_users table not found';
    END IF;
END $$;

-- Step 5: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_references_user_id ON payment_references(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_references_status ON payment_references(status);
CREATE INDEX IF NOT EXISTS idx_payment_references_created_at ON payment_references(created_at);

-- Step 6: Show final structure
SELECT 'Final table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_references' 
ORDER BY ordinal_position;

SELECT 'Migration completed!' as status;
