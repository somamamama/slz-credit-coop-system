# Membership Application Approval Workflow Changes

## Overview
Modified the membership application system to implement a two-tier approval process where admins review applications and forward them to managers for final approval, instead of admins directly approving applications.

## Changes Made

### 1. New Application Status
- Added `forwarded_to_manager` status to track applications that have been reviewed by admins and sent to managers
- Updated status badge styling with blue color for forwarded status

### 2. Role-Based Action Buttons

#### Admin Actions:
- **Forward to Manager**: Reviews application and sends it to manager for approval
- **Mark Under Review**: Marks application as under review by admin
- **Reject Application**: Admin can still reject applications directly if they don't meet basic requirements

#### Manager Actions:
- **Approve Application**: Final approval of applications forwarded by admins
- **Return for Review**: Send application back to admin for further review
- **Reject Application**: Manager can reject applications

### 3. Button States
- Buttons are disabled once an application is approved or rejected to prevent multiple actions
- Non-admin/non-manager users see a message indicating they don't have permissions

### 4. Updated Permissions
- Added `/membership-applications` route to manager permissions
- Added "Applications" menu item for managers in the sidebar

### 5. Enhanced Filter Options
- Added "Forwarded to Manager" filter option in the applications list

## New Workflow Process

1. **Application Submission**: Member submits application via landing page
2. **Admin Review**: Admin reviews application and can:
   - Forward to manager (recommended applications)
   - Mark under review (needs more information)
   - Reject (fails basic requirements)
3. **Manager Decision**: Manager receives forwarded applications and can:
   - Approve (final approval)
   - Return for review (send back to admin)
   - Reject (final rejection)

## Benefits

1. **Better Oversight**: Managers have final say on membership approvals
2. **Clear Workflow**: Defined process from admin review to manager approval
3. **Audit Trail**: All actions are logged with reasons and timestamps
4. **Role Separation**: Clear distinction between admin review and manager approval responsibilities

## Technical Implementation

### Files Modified:
1. `MembershipApplications.js` - Added role-based UI and workflow logic
2. `MembershipApplications.css` - Added styling for new status and disabled states
3. `permissions.js` - Added membership applications access for managers

### New Status Flow:
```
pending → under_review → forwarded_to_manager → approved/rejected
                    ↘                      ↗
                     → rejected ← ← ← ← ← ←
```

## Usage Instructions

### For Admins:
1. Login to staff portal
2. Go to "Applications" in sidebar or dashboard
3. Click "View Details" on any application
4. Review application information
5. Click "Forward to Manager" to send for approval
6. Or "Reject Application" if it doesn't meet requirements

### For Managers:
1. Login to staff portal
2. Go to "Applications" in sidebar
3. Filter by "Forwarded to Manager" to see pending approvals
4. Click "View Details" to review admin's assessment
5. Click "Approve Application" for final approval
6. Or "Reject Application" with reason if needed

This new workflow ensures proper oversight and maintains a clear chain of approval for membership applications.