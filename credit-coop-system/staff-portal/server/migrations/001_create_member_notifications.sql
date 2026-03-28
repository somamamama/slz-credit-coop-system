-- Migration: create member_notifications table
-- Run this against the members (staff) database used by the staff portal

CREATE TABLE IF NOT EXISTS member_notifications (
  id BIGSERIAL PRIMARY KEY,
  member_number VARCHAR(64) NOT NULL,
  application_id BIGINT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_member_notifications_member_number ON member_notifications(member_number);
CREATE INDEX IF NOT EXISTS idx_member_notifications_application_id ON member_notifications(application_id);
