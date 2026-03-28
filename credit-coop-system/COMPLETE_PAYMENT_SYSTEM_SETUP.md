# Complete Payment System Setup Instructions

## Overview
This setup creates a complete payment reference system with proper database relationships and a full workflow from member submission to staff processing.

## Database Setup

### 1. Run the Database Setup SQL
Execute the following SQL script on your PostgreSQL `slz_coop_staff` database:

```sql
-- Connect to your PostgreSQL database first
-- \c slz_coop_staff;

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
```

## Complete Payment Flow

### Current Implementation:

```
1. Member Login → JWT Token
2. Member uploads payment image → Member Portal (localhost:5001)
3. File saved + Database record created automatically
4. Staff views pending payments → Staff Portal (localhost:3001)
5. Staff confirms/rejects → Updates database
6. Member checks status → Payment History page
```

### API Endpoints:

#### Member Portal (localhost:5001):
- `POST /api/payment/reference-upload` (requires auth) - Upload payment reference
- `GET /api/payment/my-payments` (requires auth) - Get user's payment history

#### Staff Portal (localhost:3001):
- `GET /api/payments/reference` - List all payment references with member info
- `POST /api/payments/reference/:id/confirm` - Confirm a payment
- `POST /api/payments/reference/:id/reject` - Reject a payment

## Testing the System

### 1. Start Both Servers
```bash
# Terminal 1 - Member Portal
cd member-portal/server
npm start

# Terminal 2 - Staff Portal  
cd staff-portal/server
npm start
```

### 2. Test Member Flow
1. Register/Login to member portal
2. Go to Payment page
3. Upload payment reference image
4. Check Payment History page to see status

### 3. Test Staff Flow
1. Login to staff portal
2. View pending payment references
3. Confirm or reject payments
4. Verify member sees updated status

## Key Features Implemented

✅ **Database Integration**: Proper foreign key relationships
✅ **Authentication**: JWT token-based auth for member uploads
✅ **File Upload**: Secure image upload with validation
✅ **Status Tracking**: pending → confirmed/rejected workflow
✅ **Member History**: Users can track their submission status
✅ **Staff Management**: Staff can view/process all submissions

## Database Schema

### payment_references table:
- `id` - Primary key
- `user_id` - Foreign key to member_users.user_id
- `image_path` - Path to uploaded image
- `amount` - Optional payment amount
- `reference_text` - Optional reference number
- `status` - pending/confirmed/rejected
- `confirmed_by` - Staff member ID who processed
- `confirmed_by_name` - Staff member name
- `confirmed_notes` - Processing notes
- `confirmed_at` - Processing timestamp
- `created_at` - Submission timestamp
- `updated_at` - Last update timestamp

This creates a complete, production-ready payment reference system with proper data relationships and full audit trail.
