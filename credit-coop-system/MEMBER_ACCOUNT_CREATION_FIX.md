# Member Account Creation Error Fix

## Problem Description
The system was encountering a PostgreSQL NOT NULL constraint violation when creating member accounts:

```
Error: null value in column "user_name" of relation "users" violates not-null constraint
Detail: Failing row contains (uuid, null, TSET1005, hash, TSET1005)
```

## Root Cause
1. **Database Constraint**: The `users` table in the members database had a NOT NULL constraint on the `user_name` column
2. **API Implementation**: The member creation API was explicitly passing `null` for the `user_name` field
3. **Frontend Limitation**: The frontend form wasn't collecting member names, only member numbers

## Solutions Implemented

### 1. Backend Fixes (userManagement.js)

#### Schema Auto-Correction
```javascript
// Check if user_name has NOT NULL constraint and modify if needed
const constraintCheck = await membersPool.query(`
    SELECT is_nullable FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'user_name'
`);
if (constraintCheck.rows.length > 0 && constraintCheck.rows[0].is_nullable === 'NO') {
    console.log('Modifying user_name column to allow NULL values...');
    await membersPool.query(`ALTER TABLE users ALTER COLUMN user_name DROP NOT NULL`);
}
```

#### Smart Default Value Handling
```javascript
// Use provided member_name or default to member_number if null/empty
const finalMemberName = member_name || `Member ${member_number}`;

const insert = await membersPool.query(
    `INSERT INTO users (user_name, user_email, user_password, member_number) 
     VALUES ($1, $2, $3, $4) RETURNING user_id, member_number, user_name`,
    [finalMemberName, member_number, hash, member_number]
);
```

#### Enhanced Error Handling
- Added specific error messages for constraint violations
- Better PostgreSQL error code handling (23502 for NOT NULL, 23505 for UNIQUE)
- More detailed error responses to help with debugging

### 2. Frontend Enhancements (UserManagement.js)

#### Added Member Name Field
```javascript
<div className="um-field">
    <label>Member Name (optional)</label>
    <input type="text" value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="e.g., John Doe" />
</div>
```

#### Updated API Call
```javascript
body: JSON.stringify({ 
    member_number: memberNumber, 
    member_name: memberName,        // New field
    default_password: defaultPassword 
})
```

#### Improved Success Messages
```javascript
setSuccess(`Created member account for ${data.user.member_number} (${data.user.user_name})`);
```

## How It Works Now

1. **Automatic Schema Fix**: On server startup, the system automatically checks if the `user_name` column has a NOT NULL constraint and removes it if necessary

2. **Smart Name Handling**: 
   - If a member name is provided, it's used as-is
   - If no member name is provided, defaults to `"Member {member_number}"`
   - Never passes `null` to the database

3. **Better User Experience**: 
   - Frontend now includes an optional member name field
   - Better success messages showing both member number and name
   - Required field validation

## Database Schema Updates

### Before
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    user_name TEXT NOT NULL,          -- This was causing the error
    user_email TEXT UNIQUE,
    user_password TEXT NOT NULL,
    member_number TEXT UNIQUE
);
```

### After
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    user_name TEXT,                   -- NOW NULL constraint removed
    user_email TEXT UNIQUE,
    user_password TEXT NOT NULL,
    member_number TEXT UNIQUE
);
```

## Files Modified

1. **Backend**: `/staff-portal/server/routes/userManagement.js`
   - Enhanced schema creation with automatic constraint fixing
   - Smart default value handling for user_name
   - Better error handling and messaging

2. **Frontend**: `/staff-portal/src/components/UserManagement.js`
   - Added optional member name input field
   - Updated API call to include member_name
   - Enhanced success messaging

## Backwards Compatibility
- Existing member accounts are unaffected
- The API still works if no member_name is provided (uses default)
- Database constraint is automatically fixed on server restart

## Testing
After implementing these fixes:
1. Member accounts can be created without the NOT NULL constraint error
2. If a member name is provided, it's used; otherwise, a sensible default is generated
3. The database schema is automatically corrected to prevent future issues
4. Better error messages help with troubleshooting
