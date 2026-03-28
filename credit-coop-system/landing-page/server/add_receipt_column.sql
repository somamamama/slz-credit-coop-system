-- Add receipt_path and receipt_uploaded_at columns to membership_applications table
ALTER TABLE membership_applications
  ADD COLUMN IF NOT EXISTS receipt_path VARCHAR(500);

ALTER TABLE membership_applications
  ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_membership_applications_receipt_path ON membership_applications(receipt_path);
