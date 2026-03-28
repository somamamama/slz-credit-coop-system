# Comprehensive Loan Application System Setup

## Overview
This document describes the updated loan application system that handles comprehensive loan application forms with document uploads and stores data in a properly structured database.

## Database Schema

### Main Table: `loan_applications`
The new `loan_applications` table includes all the fields from the comprehensive loan application form:

#### Key Features:
- **Comprehensive Data Storage**: All form fields are properly stored
- **Document Management**: File paths for Government ID and Company ID
- **Status Tracking**: Application workflow with status history
- **Audit Trail**: Created/updated timestamps and reviewer tracking
- **Performance Optimized**: Proper indexes for efficient queries

#### Status Values:
- `pending` - Newly submitted application
- `under_review` - Being reviewed by staff
- `approved` - Loan approved
- `rejected` - Loan rejected
- `cancelled` - Application cancelled

## Setup Instructions

### 1. Database Setup

1. **Drop existing table** (if you want to start fresh):
   ```sql
   DROP TABLE IF EXISTS loan_applications;
   ```

2. **Run the schema setup**:
   ```bash
   # Option 1: Using the Node.js setup script
   node setup_loan_applications_table.js
   
   # Option 2: Manually execute the SQL file
   mysql -u root -p credit_coop_system < loan_applications_table_schema.sql
   ```

### 2. Backend Integration

1. **Install required dependencies**:
   ```bash
   npm install mysql2 multer
   ```

2. **Update environment variables** in `.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=credit_coop_system
   DB_PORT=3306
   ```

3. **The new handler is automatically integrated** in `index.js`

### 3. File Storage Setup

The system will automatically create the following directory structure:
```
member-portal/server/
├── uploads/
│   └── loan_documents/
│       ├── gov_id_file-[timestamp]-[random].jpg
│       └── company_id_file-[timestamp]-[random].jpg
```

## API Endpoints

### 1. Submit Loan Application
```http
POST /api/loan-application/submit
Content-Type: multipart/form-data

Form fields:
- All loan application form fields (see frontend form)
- gov_id_file: [File] Government ID image
- company_id_file: [File] Company ID image
- user_id: [String] Member user ID

Response:
{
  "success": true,
  "message": "Loan application submitted successfully",
  "application_id": 123,
  "member_number": "MEM001"
}
```

### 2. Get Loan Applications
```http
GET /api/loan-application/list?user_id=123

Response:
{
  "success": true,
  "applications": [
    {
      "application_id": 123,
      "user_id": 456,
      "member_number": "MEM001",
      "loan_type": "regular",
      "first_name": "John",
      "last_name": "Doe",
      "status": "pending",
      "submitted_at": "2025-10-29T10:30:00Z",
      "gov_id_file_path": "/uploads/...",
      "company_id_file_path": "/uploads/..."
    }
  ]
}
```

### 3. Get Specific Application
```http
GET /api/loan-application/123

Response:
{
  "success": true,
  "application": {
    // Complete application data with all fields
  }
}
```

### 4. Update Application Status (Staff Only)
```http
PUT /api/loan-application/update-status

{
  "application_id": 123,
  "status": "approved",
  "reviewer_comments": "Application approved after verification",
  "reviewed_by": 789
}
```

## Frontend Integration

The frontend form automatically sends data to the correct endpoint. The form includes:

### Required Fields:
- Date Filed
- Loan Type (quick/regular)
- Membership Type (regular/associate)
- Personal Information (name, gender, civil status, birth date)
- Contact Information (mobile, email)
- Address Information (current and permanent)
- Home Ownership details

### File Uploads:
- Government ID (required)
- Company ID (required)

### Optional Fields:
- Employment information
- Family information
- Additional contact details

## Database Views and Reports

The system includes helpful views for reporting:

### 1. `loan_applications_summary`
Quick overview of all applications with calculated fields.

### 2. `pending_loan_applications`
All pending applications with member contact information.

## Audit and Logging

### Status Change Logging
The system automatically logs all status changes in the `loan_application_status_log` table:
- What changed (old status → new status)
- Who made the change
- When it happened

## File Security

- Files are stored outside the web root
- Only authenticated users can access files
- File type validation prevents malicious uploads
- File size limits prevent abuse

## Testing

You can test the system with:

1. **Frontend Form**: Submit a complete loan application through the web interface
2. **API Testing**: Use tools like Postman to test individual endpoints
3. **Database Verification**: Check that data is properly stored in the database

## Migration from Old System

If you have existing loan applications, you'll need to:

1. **Backup existing data** before dropping the old table
2. **Map old fields** to new schema if possible
3. **Migrate file references** to new storage structure

## Troubleshooting

### Common Issues:

1. **File upload errors**: Check directory permissions and disk space
2. **Database connection errors**: Verify credentials and database existence
3. **Missing fields**: Ensure all required form fields are being sent

### Debug Mode:
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## Production Considerations

1. **File Storage**: Consider using cloud storage (AWS S3, etc.) for production
2. **Database Performance**: Monitor query performance and add indexes as needed
3. **Security**: Implement proper authentication and authorization
4. **Backup**: Regular database and file backups
5. **Monitoring**: Set up application monitoring and alerts

## Support

For issues or questions about the loan application system:
1. Check the application logs
2. Verify database connectivity
3. Test with sample data
4. Review the API responses for error details