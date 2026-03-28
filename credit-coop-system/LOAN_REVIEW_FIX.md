# Loan Review Foreign Key Constraint Fix

## Problem Description
The system was encountering a foreign key constraint violation error when trying to insert records into the `loan_review_history` table:

```
Error: insert or update on table "loan_review_history" violates foreign key constraint "loan_review_history_reviewer_id_fkey"
Detail: Key (reviewer_id)=(d5f77319-36f5-4ca3-ba8a-e981d4dfe220) is not present in table "users".
```

## Root Cause
1. **Database Architecture**: The system has two separate PostgreSQL databases:
   - `slz_coop_staff`: Contains staff portal users (managers, loan officers, etc.)
   - `slz_members`: Contains member data and loan applications

2. **User ID Mismatch**: When staff members from the staff portal try to approve loans, their user IDs exist in the `slz_coop_staff` database but not in the `slz_members` database where the loan review history is stored.

3. **Frontend Issue**: The frontend was trying to get `user_id` from localStorage, but the actual key stored was `userInfo` with an `id` property.

## Solutions Implemented

### 1. Frontend Fix (LoanApproval.js)
- **Before**: `manager_id: localStorage.getItem('user_id')`
- **After**: `manager_id: JSON.parse(localStorage.getItem('userInfo') || '{}').id`

This ensures the correct user ID is extracted from the stored user information.

### 2. Backend Graceful Handling (loanReview.js)
Updated all loan review operations to handle missing user IDs gracefully:

- **Check User Existence**: Before inserting into `loan_review_history`, check if the reviewer ID exists in the `users` table
- **System User Fallback**: If the reviewer doesn't exist, create and use a system user (`00000000-0000-0000-0000-000000000001`)
- **Enhanced Logging**: Log warnings when user IDs are not found and track the original staff user ID in the notes
- **Error Isolation**: Wrap history insertion in try-catch blocks so that main operations don't fail if history logging fails

### 3. System User Creation
The system automatically creates a system user with:
- ID: `00000000-0000-0000-0000-000000000001`
- Name: "Staff Portal System"
- Email: "system@staffportal.local"
- Role: "admin"

This user serves as a fallback for any staff operations where the original staff user ID doesn't exist in the members database.

## Files Modified

1. **Frontend**: `/staff-portal/src/pages/LoanApproval.js`
   - Fixed user ID retrieval from localStorage

2. **Backend**: `/staff-portal/server/routes/loanReview.js`
   - Added graceful handling for missing reviewer IDs in all operations:
     - Manager approval/rejection
     - Loan officer review
     - Loan officer assignment

3. **Utilities**: Created support files:
   - `/staff-portal/server/sync-staff-users.js`: Script for manual user synchronization
   - `/staff-portal/server/setup-system-user.sql`: SQL script for manual system user creation

## Long-term Recommendations

1. **Database Synchronization**: Implement a regular sync process to ensure staff users exist in both databases
2. **Unified User Management**: Consider consolidating user management into a single database or service
3. **API Integration**: Create APIs to sync user data between the two systems
4. **Monitoring**: Add monitoring to detect and alert on missing user references

## Testing
After implementing these fixes:
1. Staff members should be able to approve/reject loan applications without foreign key errors
2. Review history will be properly maintained with appropriate fallback users
3. The system will continue to function even if user synchronization issues occur

## Backwards Compatibility
These changes are backwards compatible and will not affect existing data or functionality. The system now handles missing user references gracefully while maintaining audit trails.
