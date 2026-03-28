# Loan Application Service

A Python service for handling loan application submissions via JPG file uploads in the Credit Cooperative System.

## Features

- **JPG File Upload**: Accept and validate JPG/JPEG file uploads
- **User Validation**: Verify that the submitting user exists in the member database
- **Database Storage**: Store application metadata in PostgreSQL
- **File Management**: Secure file storage with unique naming
- **Error Handling**: Comprehensive error handling for all operations
- **Status Tracking**: Track application status (pending, approved, rejected)

## Requirements

- Python 3.7+
- PostgreSQL database
- Required Python packages (see requirements.txt)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Set up the database table:
```bash
psql -U postgres -d slz_members -f setup_loan_applications.sql
```

## Database Schema

The service creates a `loan_applications` table with the following structure:

```sql
CREATE TABLE loan_applications (
    application_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jpg_file_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

## Usage

### Basic Setup

```python
from loan_application_service import LoanApplicationService

# Database configuration
db_config = {
    'host': 'localhost',
    'database': 'slz_members',
    'user': 'postgres',
    'password': 'password',
    'port': 5432
}

# Create service instance
loan_service = LoanApplicationService(db_config)
```

### Submit Loan Application

```python
# Assuming you have a file object from a web request
result = loan_service.submit_loan_application(user_id, jpg_file)

if result['success']:
    print(f"Application submitted! ID: {result['application_id']}")
    print(f"File saved to: {result['file_path']}")
else:
    print(f"Error: {result['message']}")
```

### Retrieve Applications

```python
# Get applications for a specific user
result = loan_service.get_loan_applications(user_id)

# Get all applications (admin view)
result = loan_service.get_loan_applications()

if result['success']:
    for app in result['applications']:
        print(f"App ID: {app['application_id']}, Status: {app['status']}")
```

### Update Application Status

```python
result = loan_service.update_application_status(application_id, 'approved')
```

## Flask Integration

The service includes Flask route helpers for easy web integration:

```python
from flask import Flask
from loan_application_service import create_flask_routes

app = Flask(__name__)
loan_service = LoanApplicationService(db_config)
create_flask_routes(app, loan_service)
```

This creates the following API endpoints:

- `POST /api/loan-application/submit` - Submit a loan application
- `GET /api/loan-application/list` - Get loan applications
- `PUT /api/loan-application/update-status` - Update application status

## File Upload API Example

```bash
# Submit loan application
curl -X POST http://localhost:5000/api/loan-application/submit \
  -F "user_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "jpg_file=@/path/to/application.jpg"

# Get applications for user
curl "http://localhost:5000/api/loan-application/list?user_id=123e4567-e89b-12d3-a456-426614174000"

# Update application status
curl -X PUT http://localhost:5000/api/loan-application/update-status \
  -H "Content-Type: application/json" \
  -d '{"application_id": 1, "status": "approved"}'
```

## File Validation

The service validates uploaded files to ensure they are valid JPG/JPEG images:

- **File Extension**: Must be .jpg or .jpeg
- **MIME Type**: Must be image/jpeg or image/jpg
- **Image Format**: Must be a valid JPEG image (verified with PIL)
- **File Size**: Maximum 10MB (configurable)

## Error Handling

The service handles various error conditions:

- **Invalid User ID**: User doesn't exist in the database
- **File Upload Failures**: Missing file, invalid file type, file too large
- **Database Connection Issues**: Connection failures, query errors
- **File System Errors**: Permission issues, disk space problems

## Security Features

- **Secure Filenames**: Uses `secure_filename()` to prevent path traversal
- **Unique Filenames**: Generates unique filenames to prevent conflicts
- **File Type Validation**: Multiple layers of file type validation
- **Database Constraints**: Foreign key constraints ensure data integrity

## Testing

Run the test script to verify the service works correctly:

```bash
python test_loan_application.py
```

For usage examples only:
```bash
python test_loan_application.py --examples
```

## Configuration

### Database Configuration

Update the `db_config` dictionary with your database settings:

```python
db_config = {
    'host': 'your-db-host',
    'database': 'your-database-name',
    'user': 'your-username',
    'password': 'your-password',
    'port': 5432
}
```

### File Upload Configuration

You can modify these settings in the `LoanApplicationService` class:

```python
self.upload_folder = "loan_applications"  # Upload directory
self.allowed_extensions = {'jpg', 'jpeg'}  # Allowed file extensions
self.max_file_size = 10 * 1024 * 1024     # Max file size (10MB)
```

## File Structure

```
member-portal/server/
├── loan_application_service.py    # Main service class
├── test_loan_application.py       # Test script
├── setup_loan_applications.sql    # Database setup script
├── requirements.txt               # Python dependencies
├── LOAN_APPLICATION_README.md     # This documentation
└── loan_applications/            # Upload directory (created automatically)
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists

2. **File Upload Error**
   - Check file permissions on upload directory
   - Verify file is valid JPG/JPEG
   - Check file size limits

3. **User Validation Error**
   - Ensure user exists in the users table
   - Check user_id format (should be UUID)

### Debug Mode

Enable debug logging by modifying the service:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## License

This service is part of the Credit Cooperative System project.
