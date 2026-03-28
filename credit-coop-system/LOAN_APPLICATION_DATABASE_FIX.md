# Updated Loan Application System

This document describes the corrected and improved loan application system that properly integrates with the member database.

## Key Changes Made

### ✅ Database Connection Fixed
- **Before**: Using inconsistent database connections
- **After**: Now consistently connects to `slz_coop_staff` database
- **Impact**: All loan application data stored in the main staff database

### ✅ Table References Updated
- **Before**: Referenced generic `users` table
- **After**: Now references `member_users` table
- **Impact**: Proper validation of member accounts and foreign key relationships

### ✅ Member-Specific Validation
- **Before**: Basic user existence check
- **After**: Validates member account exists, is active, and belongs to member_users table
- **Impact**: Better security and user experience

### ✅ Enhanced Error Messages
- **Before**: Generic error messages
- **After**: Specific messages for inactive accounts, non-existent members, etc.
- **Impact**: Better user feedback and easier troubleshooting

## Database Architecture

```
slz_coop_staff Database
├── member_users (Member accounts)
│   ├── user_id (UUID, Primary Key)
│   ├── user_name (VARCHAR, Optional)
│   ├── user_email (VARCHAR, Unique)
│   ├── user_password (VARCHAR, Hashed)
│   ├── member_number (VARCHAR, Unique)
│   ├── is_active (BOOLEAN)
│   └── created_at, updated_at (TIMESTAMP)
│
└── loan_applications (Loan submissions)
    ├── application_id (SERIAL, Primary Key)
    ├── user_id (UUID, Foreign Key → member_users.user_id)
    ├── jpg_file_path (VARCHAR)
    ├── status (VARCHAR: pending/approved/rejected)
    └── submitted_at (TIMESTAMP)
```

## Setup Instructions

### 1. Database Setup

Run the setup script to ensure proper database structure:

```bash
cd member-portal/server
node setup_members_database.js
```

Or manually:

```bash
psql -U postgres -d slz_coop_staff -f setup_members_database.sql
```

### 2. Verify Configuration

Check that these files have correct database settings:

**member-portal/server/db_members.js**
```javascript
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'slz_coop_staff',  // ✅ Correct database
  password: 'password',
  port: 5432,
});
```

**loan_application_service.py**
```python
db_config = {
    'host': 'localhost',
    'database': 'slz_coop_staff',  # ✅ Correct database
    'user': 'postgres',
    'password': 'password',
    'port': 5432
}
```

### 3. Test the System

#### Test with CLI:
```bash
cd member-portal/server
python3 loan_cli.py --test
```

#### Test with Node.js:
```bash
cd member-portal/server
node -e "
const service = require('./loan_application_integration');
console.log('Loan application system ready!');
"
```

## API Endpoints

### Submit Loan Application
- **URL**: `POST /api/loan-application/submit`
- **Body**: FormData with `user_id` and `jpg_file`
- **Validation**: 
  - Member must exist in `member_users` table
  - Member account must be active (`is_active = true`)
  - File must be JPG/JPEG format
  - File size must be ≤ 10MB

### Get Applications
- **URL**: `GET /api/loan-application/list?user_id={uuid}`
- **Response**: Applications with member details from `member_users`

### Update Status
- **URL**: `PUT /api/loan-application/update-status`
- **Body**: `{"application_id": int, "status": "approved|rejected|pending"}`

## Member Account Integration

The system now properly integrates with the member management system:

1. **Member Creation**: IT Admin creates accounts in `member_users` table
2. **Member Login**: Members login using email/member_number from `member_users`
3. **Loan Applications**: Applications reference the correct member account
4. **Staff Review**: Staff can see member details with applications

## File Structure

```
member-portal/server/
├── loan_application_service.py     # ✅ Updated Python service
├── loan_cli.py                     # ✅ Updated CLI tool
├── loan_application_integration.js # Node.js integration
├── db_members.js                   # ✅ Fixed database connection
├── setup_members_database.sql      # ✅ New setup script
├── setup_members_database.js       # ✅ New setup tool
└── loan_applications/              # Upload directory
```

## Testing

### 1. Create Test Member
```sql
INSERT INTO member_users (user_name, user_email, user_password, member_number, is_active)
VALUES ('Test Member', 'test@example.com', '$hashed_password', 'M-001', true);
```

### 2. Submit Test Application
```bash
python3 loan_cli.py --submit {user_id} /path/to/test.jpg
```

### 3. Verify Storage
```sql
SELECT la.*, mu.user_name, mu.member_number 
FROM loan_applications la
JOIN member_users mu ON la.user_id = mu.user_id;
```

## Migration Notes

If you have existing loan applications in the wrong database:

1. **Backup existing data**
2. **Run setup scripts** to create correct structure
3. **Migrate data** if needed:
   ```sql
   -- Example migration (adjust as needed)
   INSERT INTO slz_members.loan_applications 
   SELECT * FROM slz_coop_staff.loan_applications 
   WHERE user_id EXISTS (SELECT user_id FROM slz_members.member_users);
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify `slz_members` database exists
   - Check credentials in configuration files

2. **User Validation Fails**
   - Ensure member exists in `member_users` table
   - Check that member account is active (`is_active = true`)

3. **Foreign Key Constraint Error**
   - Verify `member_users` table exists before creating loan applications
   - Ensure user_id exists in `member_users` table

### Debug Commands

```bash
# Check database connection
psql -U postgres -d slz_members -c "SELECT COUNT(*) FROM member_users;"

# Verify table structure
psql -U postgres -d slz_members -c "\d+ member_users"
psql -U postgres -d slz_members -c "\d+ loan_applications"

# Test Python service
python3 loan_cli.py --list
```

## Security Improvements

1. **Member Validation**: Only active members can submit applications
2. **Database Isolation**: Member data stored in dedicated database
3. **Foreign Key Constraints**: Ensures data integrity
4. **File Validation**: Enhanced JPG/JPEG file validation
5. **Error Handling**: No sensitive information in error messages

## Summary

The loan application system now:
- ✅ Connects to the correct member database (`slz_members`)
- ✅ Uses the proper member table (`member_users`)
- ✅ Validates member accounts correctly
- ✅ Stores applications with proper foreign key relationships
- ✅ Provides better error messages and user feedback
- ✅ Integrates seamlessly with the member management system

This ensures that loan applications are properly associated with member accounts and can be reviewed by staff with full member context.
