-- Migration script to fix cashier_id column type in invoices table
-- Run this script in your PostgreSQL database (slz_coop_staff)

-- First check if the table exists and what the current column type is
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
    AND column_name = 'cashier_id';

-- If the table exists and cashier_id is INTEGER, we need to modify it
-- First, let's see if there's any data in the table
SELECT COUNT(*) as invoice_count FROM invoices;

-- Option 1: If there's no data or you can recreate the table
-- DROP TABLE IF EXISTS invoices;

-- Option 2: If there's data, we need to handle the migration carefully
-- Step 1: Add a new UUID column
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cashier_id_new UUID;

-- Step 2: If you have existing data, you might need to map it
-- For now, we'll just copy over any existing cashier_id as text if possible
-- UPDATE invoices SET cashier_id_new = cashier_id::text::uuid WHERE cashier_id IS NOT NULL;

-- Step 3: Drop the old column and rename the new one
-- ALTER TABLE invoices DROP COLUMN IF EXISTS cashier_id;
-- ALTER TABLE invoices RENAME COLUMN cashier_id_new TO cashier_id;

-- Safer approach: Just recreate the table if it's empty or you can afford to lose data
-- Replace the table with the correct schema
CREATE TABLE IF NOT EXISTS invoices_new (
    id SERIAL PRIMARY KEY,
    member_id INTEGER,
    member_name TEXT NOT NULL,
    member_number TEXT,
    cashier_id UUID,
    cashier_name TEXT,
    items JSONB NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    tax NUMERIC(12,2) DEFAULT 0,
    discount NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- If you want to preserve existing data, copy it over
-- INSERT INTO invoices_new (member_id, member_name, member_number, cashier_name, items, subtotal, tax, discount, total, notes, created_at)
-- SELECT member_id, member_name, member_number, cashier_name, items, subtotal, tax, discount, total, notes, created_at FROM invoices;

-- Drop old table and rename new one
-- DROP TABLE IF EXISTS invoices;
-- ALTER TABLE invoices_new RENAME TO invoices;

-- Verify the new schema
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoices' 
ORDER BY ordinal_position;
