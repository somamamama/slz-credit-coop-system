-- Add id_document_path column to membership_applications table
ALTER TABLE membership_applications 
ADD COLUMN IF NOT EXISTS id_document_path VARCHAR(500);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_membership_applications_id_document ON membership_applications(id_document_path);