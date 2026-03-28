# Three-Tier Membership Application Approval Workflow

## Overview
Updated the membership application system to implement a three-tier approval process: Admin → Manager → IT Admin, ensuring proper oversight and account creation workflow.

## New Workflow Process

### 1. **Application Submission**
- Member submits application via landing page
- Status: `pending`

### 2. **Admin Review (Tier 1)**
- Admin reviews application for completeness and basic requirements
- **Actions Available:**
  - **Forward to Manager**: Send to manager for business approval
  - **Mark Under Review**: Request more information or clarification
  - **Reject Application**: Fails basic requirements (incomplete, invalid data, etc.)

### 3. **Manager Approval (Tier 2)**
- Manager receives applications forwarded by admin
- Reviews for business/financial approval
- **Actions Available:**
  - **Approve & Forward to IT**: Business approval granted, send to IT for account creation
  - **Return for Review**: Send back to admin for additional review
  - **Reject Application**: Business rejection (credit issues, policy violations, etc.)

### 4. **IT Admin Processing (Tier 3)**
- IT Admin receives manager-approved applications
- Handles technical account creation and system setup
- **Actions Available:**
  - **Create Account & Approve**: Final approval with account creation
  - **Return to Manager**: Technical issues or additional approval needed
  - **Reject Application**: Technical/system-related rejection

## Application Status Flow

```
pending 
   ↓
under_review (Admin)
   ↓
forwarded_to_manager (Admin → Manager)
   ↓
forwarded_to_it_admin (Manager → IT Admin)
   ↓
approved (IT Admin - Final)

Note: Any tier can reject, ending the process
```

## Role Permissions & Responsibilities

### **Admin (Tier 1)**
- **Permissions**: `/membership-applications`
- **Responsibilities**: 
  - Initial review for completeness
  - Data validation
  - Basic requirement checks
- **Cannot**: Directly approve applications
- **Can**: Forward to manager, mark under review, reject

### **Manager (Tier 2)**
- **Permissions**: `/membership-applications`
- **Responsibilities**:
  - Business approval decisions
  - Financial/credit assessment
  - Policy compliance review
- **Cannot**: Directly approve applications (must forward to IT)
- **Can**: Forward to IT admin, return to admin, reject

### **IT Admin (Tier 3)**
- **Permissions**: `/membership-applications`, `/user-management`
- **Responsibilities**:
  - Account creation
  - System access setup
  - Final approval processing
- **Can**: Create accounts and approve, return to manager, reject

## User Interface Updates

### **Status Badges:**
- `PENDING` - Red badge (new applications)
- `UNDER REVIEW` - Yellow badge (needs review)
- `FORWARDED TO MANAGER` - Blue badge (admin → manager)
- `FORWARDED TO IT ADMIN` - Green badge (manager → IT admin)
- `APPROVED` - Green badge (final approval)
- `REJECTED` - Red badge (rejected at any stage)

### **Filter Options:**
- All Applications
- Pending
- Under Review
- Forwarded to Manager
- Forwarded to IT Admin
- Approved
- Rejected

### **Action Buttons:**
- Role-specific buttons appear based on user permissions
- Buttons are disabled once applications are approved/rejected
- Clear labeling indicates next step in workflow

## Benefits of Three-Tier System

1. **Separation of Concerns**:
   - Admin: Data validation
   - Manager: Business decisions
   - IT Admin: Technical implementation

2. **Better Security**:
   - No single person can approve and create accounts
   - Multiple approval checkpoints

3. **Audit Trail**:
   - Complete tracking of who approved what and when
   - Reasons recorded for all actions

4. **Scalability**:
   - Clear workflow for handling large volumes
   - Proper delegation of responsibilities

## Implementation Details

### Files Modified:
1. `MembershipApplications.js` - Added IT admin role and three-tier workflow
2. `MembershipApplications.css` - Added styling for new status
3. `permissions.js` - Added membership applications access for IT admin

### New Status Added:
- `forwarded_to_it_admin` - Applications approved by manager awaiting IT processing

### Database Impact:
- No database schema changes required
- Uses existing status field with new value
- Existing review_notes field stores all action reasons

## Usage Instructions

### For Each Role:

**Admins:**
1. Review new applications for completeness
2. Forward complete applications to managers
3. Reject incomplete or invalid applications

**Managers:**
1. Filter by "Forwarded to Manager" 
2. Review business aspects of applications
3. Forward approved applications to IT admin
4. Return problematic applications to admin

**IT Admins:**
1. Filter by "Forwarded to IT Admin"
2. Create member accounts in the system
3. Complete final approval process
4. Return applications if technical issues arise

This three-tier system ensures proper oversight while maintaining efficient processing of membership applications.