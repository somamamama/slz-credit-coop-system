-- Migration: add outstanding_balance to loan_applications and create payments table
-- Run this against your member-portal database (psql) before enabling server-side payment confirmation.

BEGIN;

-- Add outstanding_balance column (if not exists)
ALTER TABLE IF EXISTS loan_applications
ADD COLUMN IF NOT EXISTS outstanding_balance DECIMAL(15,2) DEFAULT 0;

-- If there is a loan_amount or amount column, initialize outstanding_balance from it for existing rows
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loan_applications' AND column_name='loan_amount') THEN
		EXECUTE 'UPDATE loan_applications SET outstanding_balance = COALESCE(outstanding_balance, loan_amount, 0) WHERE outstanding_balance IS NULL OR outstanding_balance = 0';
	ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loan_applications' AND column_name='amount') THEN
		EXECUTE 'UPDATE loan_applications SET outstanding_balance = COALESCE(outstanding_balance, amount, 0) WHERE outstanding_balance IS NULL OR outstanding_balance = 0';
	END IF;
END$$;

-- Create payments table to record incoming payments
CREATE TABLE IF NOT EXISTS payments (
	id SERIAL PRIMARY KEY,
	payment_provider_id VARCHAR(255),
	application_id INTEGER,
	member_number VARCHAR(50),
	amount DECIMAL(15,2) NOT NULL,
	currency VARCHAR(10) DEFAULT 'PHP',
	status VARCHAR(50),
	paid_at TIMESTAMP,
	raw_payload JSONB,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (application_id) REFERENCES loan_applications(application_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_application_id ON payments(application_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_provider_id ON payments(payment_provider_id);

COMMIT;

-- End of migration
