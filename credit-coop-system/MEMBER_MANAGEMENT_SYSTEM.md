# Member Management System

A comprehensive user management system for IT Administrators to manage member accounts in the Credit Cooperative System.

## Overview

The Member Management System allows IT Administrators to:
- Create new member accounts
- View and search existing members
- Edit member information
- Activate/deactivate member accounts
- Delete member accounts
- Reset member passwords

## Database Schema

### member_users Table

The system uses a dedicated `member_users` table with the following structure:

```sql
CREATE TABLE member_users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    member_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

## Setup Instructions

### 1. Database Setup

Run the database setup script to create the member_users table:

```bash
cd staff-portal/server
node setup_member_users.js
```

Or manually run the SQL:

```bash
psql -U postgres -d slz_members -f setup_member_users.sql
```

### 2. Backend Routes

The system provides the following API endpoints:

#### GET /api/user-management/members
- **Description**: Get all members with pagination and search
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `search` (optional): Search term for name, email, or member number
  - `status` (optional): Filter by status ('all', 'active', 'inactive')
- **Authorization**: IT Admin only

#### GET /api/user-management/members/:id
- **Description**: Get a specific member by ID
- **Authorization**: IT Admin only

#### POST /api/user-management/members
- **Description**: Create a new member account
- **Body**:
  ```json
  {
    "member_number": "M-0001",
    "member_name": "John Doe",
    "user_email": "john@example.com",
    "default_password": "temp123"
  }
  ```
- **Authorization**: IT Admin only

#### PUT /api/user-management/members/:id
- **Description**: Update a member account
- **Body**:
  ```json
  {
    "user_name": "John Doe Updated",
    "user_email": "john.updated@example.com",
    "member_number": "M-0001",
    "new_password": "newpass123"
  }
  ```
- **Authorization**: IT Admin only

#### DELETE /api/user-management/members/:id
- **Description**: Delete a member account
- **Authorization**: IT Admin only

#### PATCH /api/user-management/members/:id/toggle-status
- **Description**: Toggle member active/inactive status
- **Authorization**: IT Admin only

## Frontend Features

### Member Management Interface

The IT Admin interface provides:

1. **Member List View**
   - Paginated table of all members
   - Search functionality (name, email, member number)
   - Status filtering (all, active, inactive)
   - Sort by creation date

2. **Create Member Form**
   - Member number (required, unique)
   - Email address (required, unique)
   - Member name (optional)
   - Default password (required)

3. **Edit Member Form**
   - Update member information
   - Change password (optional)
   - Maintain existing data

4. **Member Actions**
   - Edit member details
   - Activate/Deactivate account
   - Delete member account
   - View member information

### User Interface Components

- **Search Bar**: Real-time search across member data
- **Status Filter**: Filter by active/inactive status
- **Pagination**: Navigate through large member lists
- **Modal Forms**: Create and edit members in modal dialogs
- **Action Buttons**: Quick actions for each member
- **Status Indicators**: Visual status indicators for active/inactive members

## Security Features

### Authentication & Authorization
- Only IT Admin role can access member management
- JWT token-based authentication
- Role-based access control

### Password Security
- Passwords are hashed using bcrypt with salt rounds
- Default passwords provided by IT Admin
- Members can change passwords after login

### Data Validation
- Email uniqueness validation
- Member number uniqueness validation
- Required field validation
- Input sanitization

## Member Portal Integration

### Login System
- Members can login using either email or member number
- Only active members can login
- Password verification with bcrypt

### Registration
- Member registration is disabled
- All accounts must be created by IT Admin
- Clear messaging about account creation process

## Usage Instructions

### For IT Administrators

1. **Access the System**
   - Login to staff portal with IT Admin credentials
   - Navigate to "User Management" section

2. **Create New Member**
   - Click "Create New Member" button
   - Fill in required information:
     - Member Number (unique identifier)
     - Email Address (login credential)
     - Member Name (optional)
     - Default Password (temporary)
   - Click "Create Member"

3. **Manage Existing Members**
   - Use search to find specific members
   - Filter by status (active/inactive)
   - Edit member information as needed
   - Activate/deactivate accounts
   - Delete accounts when necessary

4. **Member Account Lifecycle**
   - Create account with default password
   - Member receives login credentials
   - Member can change password after first login
   - IT Admin can reset password if needed
   - Account can be deactivated/reactivated
   - Account can be deleted if no longer needed

### For Members

1. **Login Process**
   - Use email or member number to login
   - Enter password provided by IT Admin
   - Change password after first login

2. **Account Information**
   - View account details
   - Update personal information (if allowed)
   - Change password

## Error Handling

The system provides comprehensive error handling:

- **Validation Errors**: Clear messages for missing or invalid data
- **Duplicate Errors**: Specific messages for duplicate emails/member numbers
- **Network Errors**: User-friendly error messages for connection issues
- **Permission Errors**: Clear indication when access is denied

## File Structure

```
staff-portal/
├── server/
│   ├── routes/
│   │   └── userManagement.js          # Backend API routes
│   ├── setup_member_users.sql         # Database schema
│   └── setup_member_users.js          # Database setup script
├── src/
│   └── components/
│       ├── UserManagement.js          # Frontend component
│       └── UserManagement.css        # Styling
└── member-portal/
    └── server/
        └── routes/
            └── coopauth.js            # Updated member authentication
```

## Dependencies

### Backend
- Express.js
- PostgreSQL
- bcrypt (password hashing)
- JWT (authentication)

### Frontend
- React
- Modern CSS with responsive design

## Testing

To test the system:

1. **Setup Database**
   ```bash
   cd staff-portal/server
   node setup_member_users.js
   ```

2. **Start Backend Server**
   ```bash
   cd staff-portal/server
   npm start
   ```

3. **Start Frontend**
   ```bash
   cd staff-portal
   npm start
   ```

4. **Test Member Creation**
   - Login as IT Admin
   - Navigate to User Management
   - Create a test member
   - Verify member can login to member portal

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure slz_members database exists

2. **Permission Denied**
   - Verify user has IT Admin role
   - Check JWT token validity
   - Ensure proper authentication

3. **Member Cannot Login**
   - Check if account is active
   - Verify email/member number
   - Confirm password is correct

### Support

For technical support or questions about the Member Management System, contact the development team or refer to the system documentation.
