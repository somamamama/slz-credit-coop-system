-- test_insert_loan_application.sql
-- Simple test INSERT for `loan_applications` that omits `application_id`
-- so the sequence/default should generate the id.
-- Run this after you've applied the sequence migration to verify the column default works.
-- Usage:
--   psql -h HOST -U USER -d DBNAME -f db-migrations/test_insert_loan_application.sql

-- NOTE: This insert provides values for all NOT NULL columns from
-- the schema in loan_applications_schema_only.sql. Adjust values if your
-- environment requires different sample data.

INSERT INTO loan_applications (
  user_id,
  date_filed,
  loan_type,
  membership_type,
  last_name,
  first_name,
  gender,
  civil_status,
  birth_date,
  mobile_number,
  email_address,
  current_address,
  years_of_stay_current,
  permanent_address,
  years_of_stay_permanent,
  home_ownership
)
VALUES (
  1,
  CURRENT_DATE,
  'regular',        -- allowed: 'quick' or 'regular'
  'regular',        -- allowed: 'regular' or 'associate'
  'Doe',
  'Test',
  'male',           -- allowed: 'male','female','other'
  'single',         -- allowed: 'single','married','divorced','widowed'
  '1990-01-01',
  '09171234567',
  'test+loan@example.com',
  '100 Test St, Test City',
  1.0,
  '100 Test St, Test City',
  2.0,
  'owned_fully_paid'  -- allowed values documented in schema
)
RETURNING application_id;

-- After running, you should see a returned application_id (assigned by sequence).
-- You can also run:
--   SELECT column_default FROM information_schema.columns
--     WHERE table_schema='public' AND table_name='loan_applications' AND column_name='application_id';
