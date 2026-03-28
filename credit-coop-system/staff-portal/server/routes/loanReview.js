const express = require('express');
const { Pool } = require('pg');
const { spawn } = require('child_process');
const path = require('path');
const router = express.Router();

// Fixed system user id used as a fallback when the real user is missing.
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
router.post('/applications/:id/set-loan-amount', async (req, res) => {
    try {
        const { id } = req.params;
        const { loan_amount, loan_duration, monthly_payment } = req.body;
        // Update the loan_applications table
        const updateQuery = `
            UPDATE loan_applications
            SET amount = $1, duration_months = $2, monthly_payment = $3
            WHERE application_id = $4 AND review_status = 'approved'
            RETURNING *
        `;
        const result = await membersPool.query(updateQuery, [loan_amount, loan_duration, monthly_payment, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found or not approved'
            });
        }
        // Optionally, trigger update/notification for member dashboard here
        res.json({
            success: true,
            message: 'Loan amount and duration updated',
            application: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating loan amount:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating loan amount'
        });
    }
});
// ...existing code...

// Connect to members database for loan applications
const membersPool = new Pool({
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    database: 'slz_coop_staff',
    port: 5432,
});

// Get all loan applications for review
router.get('/applications', async (req, res) => {
    try {
        const { status, reviewer_role, reviewer_id } = req.query;
        
        let query = `
            SELECT 
                la.*,
                ma.facebook_account as facebook_account
            FROM loan_applications la
            LEFT JOIN membership_applications ma ON la.member_number = ma.applicants_membership_number
        `;
        
        const conditions = [];
        const params = [];
        
        if (status) {
            conditions.push(`la.review_status = $${params.length + 1}`);
            params.push(status);
        }
        
        if (reviewer_role === 'loan_officer' && reviewer_id) {
            conditions.push(`(la.loan_officer_id = $${params.length + 1} OR la.loan_officer_id IS NULL)`);
            params.push(reviewer_id);
        }
        
        if (reviewer_role === 'manager' && reviewer_id) {
            conditions.push(`la.review_status = 'under_review'`);
        }
        
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }
        
        query += ` ORDER BY la.submitted_at DESC`;
        
        const result = await membersPool.query(query, params);
        console.log('DEBUG: Loan applications query result:', result.rows);

        res.json({
            success: true,
            applications: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching loan applications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching loan applications'
        });
    }
});

// Get single loan application details
router.get('/applications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                la.*,
                ma.facebook_account as facebook_account
            FROM loan_applications la
            LEFT JOIN membership_applications ma ON la.member_number = ma.applicants_membership_number
            WHERE la.application_id = $1
        `;
        
        const result = await membersPool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        
        // Get review history
        const historyQuery = `
            SELECT 
                lrh.*,
                u.user_name as reviewer_name
            FROM loan_review_history lrh
            LEFT JOIN users u ON lrh.reviewer_id = u.user_id
            WHERE lrh.application_id = $1
            ORDER BY lrh.created_at DESC
        `;
        
        const historyResult = await membersPool.query(historyQuery, [id]);
        
        res.json({
            success: true,
            application: result.rows[0],
            reviewHistory: historyResult.rows
        });
        
    } catch (error) {
        console.error('Error fetching loan application:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching loan application'
        });
    }
});

// Assign loan officer to application
router.post('/applications/:id/assign', async (req, res) => {
    try {
        const { id } = req.params;
        const { loan_officer_id } = req.body;
        
        const query = `
            UPDATE loan_applications 
            SET loan_officer_id = $1, review_status = 'under_review'
            WHERE application_id = $2 AND review_status = 'pending_review'
            RETURNING *
        `;
        
        const result = await membersPool.query(query, [loan_officer_id, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found or already assigned'
            });
        }
        
        // Add to review history - handle missing loan officer ID gracefully
        try {
            const userCheck = await membersPool.query(
                'SELECT user_id FROM users WHERE user_id = $1',
                [loan_officer_id]
            );
            
            let finalOfficerId = loan_officer_id;
            if (userCheck.rows.length === 0) {
                console.warn(`Loan officer ID ${loan_officer_id} not found in members database.`);
                
                // Create a system user for staff operations if it doesn't exist
                // Ensure a system user exists in both `users` and `member_users` so FK constraints are satisfied.
                await membersPool.query(
                    `INSERT INTO users (user_id, user_name, user_email, user_role, user_password)
                     VALUES ($1, 'Staff Portal System', 'system@staffportal.local', 'admin', 'system-hash')
                     ON CONFLICT (user_id) DO NOTHING`,
                    [SYSTEM_USER_ID]
                );

                // Also create a minimal entry in member_users so loan_review_history FK (which references member_users)
                // will not fail when reviewer_id is the system id. Use a placeholder member_number 'SYSTEM'.
                try {
                    await membersPool.query(
                        `INSERT INTO member_users (user_id, user_name, user_email, member_number, is_active, created_at)
                         VALUES ($1, 'Staff Portal System', 'system@staffportal.local', 'SYSTEM', true, NOW())
                         ON CONFLICT (user_id) DO NOTHING`,
                        [SYSTEM_USER_ID]
                    );
                } catch (muErr) {
                    // If member_users doesn't exist or has different columns, log but continue.
                    console.warn('Could not create system entry in member_users (non-fatal):', muErr.message || muErr);
                }

                finalOfficerId = SYSTEM_USER_ID;
            }
            
            await membersPool.query(
                `INSERT INTO loan_review_history (application_id, reviewer_id, reviewer_role, action_taken, notes)
                 VALUES ($1, $2, 'loan_officer', 'assigned', $3)`,
                [id, finalOfficerId, finalOfficerId === SYSTEM_USER_ID ? 
                    `Application assigned for review (staff officer: ${loan_officer_id})` : 
                    'Application assigned for review']
            );
        } catch (historyError) {
            console.error('Error adding to review history:', historyError);
            // Don't fail the main operation if history insertion fails
        }
        
        res.json({
            success: true,
            message: 'Application assigned successfully',
            application: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error assigning application:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning application'
        });
    }
});

// Loan officer review action
router.post('/applications/:id/review', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            action, 
            notes, 
            reviewer_id, 
            loan_amount, 
            interest_rate, 
            loan_term_months,
            loan_purpose,
            credit_score,
            monthly_income,
            employment_status,
            collateral_description,
            priority_level
        } = req.body;
        
        // Sanitize and coerce potentially empty string inputs for numeric fields
        const toNullableNumber = (value) => {
            if (value === undefined || value === null || value === '') return null;
            const num = Number(value);
            return Number.isFinite(num) ? num : null;
        };

        const toNullableInteger = (value) => {
            if (value === undefined || value === null || value === '') return null;
            const num = parseInt(value, 10);
            return Number.isFinite(num) ? num : null;
        };

        const sanitizedLoanAmount = toNullableNumber(loan_amount);
        const sanitizedInterestRate = toNullableNumber(interest_rate);
        const sanitizedLoanTermMonths = toNullableInteger(loan_term_months);
        const sanitizedCreditScore = toNullableInteger(credit_score);
        const sanitizedMonthlyIncome = toNullableNumber(monthly_income);

        let updateQuery = '';
        let status = '';
        let params = [];
        
        switch (action) {
            case 'approve_for_manager':
                updateQuery = `
                    UPDATE loan_applications 
                    SET 
                        review_status = 'under_review',
                        reviewed_at = CURRENT_TIMESTAMP
                    WHERE application_id = $1
                    RETURNING *
                `;
                status = 'under_review';
                params = [
                    id
                ];
                break;
                
            case 'return_to_member':
                updateQuery = `
                    UPDATE loan_applications 
                    SET 
                        review_status = 'returned',
                        reviewed_at = CURRENT_TIMESTAMP
                    WHERE application_id = $1
                    RETURNING *
                `;
                status = 'returned';
                params = [
                    id
                ];
                break;
                
            case 'reject':
                updateQuery = `
                    UPDATE loan_applications 
                    SET 
                        review_status = 'rejected',
                        reviewed_at = CURRENT_TIMESTAMP,
                        rejected_at = CURRENT_TIMESTAMP
                    WHERE application_id = $1
                    RETURNING *
                `;
                status = 'rejected';
                params = [
                    id
                ];
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action'
                });
        }
        
        // params are set per action above
        
        const result = await membersPool.query(updateQuery, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        
        // Add to review history - handle missing reviewer ID gracefully
        try {
            // Ensure reviewer_id exists in members DB by preferring the application's loan_officer_id
            let historyReviewerId = reviewer_id;
            const appReviewer = await membersPool.query(
                'SELECT loan_officer_id FROM loan_applications WHERE application_id = $1',
                [id]
            );
            if (appReviewer.rows[0] && appReviewer.rows[0].loan_officer_id) {
                historyReviewerId = appReviewer.rows[0].loan_officer_id;
            }
            
            // Check if the reviewer exists in the users table
            const userCheck = await membersPool.query(
                'SELECT user_id FROM users WHERE user_id = $1',
                [historyReviewerId]
            );
            
            let finalReviewerId = historyReviewerId;
            let reviewerNotes = notes;
            
            if (userCheck.rows.length === 0) {
                console.warn(`Reviewer ID ${historyReviewerId} not found in members database.`);
                
                // Create a system user for staff operations if it doesn't exist
                // Ensure system user exists in both users and member_users
                await membersPool.query(
                    `INSERT INTO users (user_id, user_name, user_email, user_role, user_password)
                     VALUES ($1, 'Staff Portal System', 'system@staffportal.local', 'admin', 'system-hash')
                     ON CONFLICT (user_id) DO NOTHING`,
                    [SYSTEM_USER_ID]
                );
                try {
                    await membersPool.query(
                        `INSERT INTO member_users (user_id, user_name, user_email, member_number, is_active, created_at)
                         VALUES ($1, 'Staff Portal System', 'system@staffportal.local', 'SYSTEM', true, NOW())
                         ON CONFLICT (user_id) DO NOTHING`,
                        [SYSTEM_USER_ID]
                    );
                } catch (muErr) {
                    console.warn('Could not create system entry in member_users (non-fatal):', muErr.message || muErr);
                }

                finalReviewerId = SYSTEM_USER_ID;
                reviewerNotes = `${reviewerNotes} (Review by staff portal officer: ${historyReviewerId})`;
            }
            
            await membersPool.query(
                `INSERT INTO loan_review_history (application_id, reviewer_id, reviewer_role, action_taken, notes)
                 VALUES ($1, $2, 'loan_officer', $3, $4)`,
                [id, finalReviewerId, action, reviewerNotes]
            );
        } catch (historyError) {
            console.error('Error adding to review history:', historyError);
            // Don't fail the main operation if history insertion fails
        }
        
        res.json({
            success: true,
            message: `Application ${action} successfully`,
            application: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error reviewing application:', error);
        res.status(500).json({
            success: false,
            message: 'Error reviewing application'
        });
    }
});

// Manager approval/rejection
router.post('/applications/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        // manager_id is expected from the frontend (the manager performing the action)
        const { action, notes, reviewer_id, manager_id } = req.body;
        let updateQuery = '';
        let status = '';
        if (action === 'approve') {
            updateQuery = `
                UPDATE loan_applications 
                SET 
                    review_status = 'approved',
                    reviewer_comments = $1,
                    reviewed_at = CURRENT_TIMESTAMP
                WHERE application_id = $2 AND review_status = 'under_review'
                RETURNING *
            `;
            status = 'approved';
        } else if (action === 'reject') {
            updateQuery = `
                UPDATE loan_applications 
                SET 
                    review_status = 'rejected',
                    reviewer_comments = $1,
                    reviewed_at = CURRENT_TIMESTAMP
                WHERE application_id = $2 AND review_status = 'under_review'
                RETURNING *
            `;
            status = 'rejected';
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid action'
            });
        }
        const result = await membersPool.query(updateQuery, [notes, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found or not ready for approval'
            });
        }
        
        // Add to review history - handle missing manager ID gracefully
        try {
            // Check if the manager_id exists in the users table
            const userCheck = await membersPool.query(
                'SELECT user_id FROM users WHERE user_id = $1',
                [manager_id]
            );
            
            let reviewerId = manager_id;
            let reviewerNotes = notes || `Decision: ${action} by manager`;
            
            if (userCheck.rows.length === 0) {
                // Manager doesn't exist in members database
                console.warn(`Manager ID ${manager_id} not found in members database. Creating system entry.`);
                
                // Create a system user for staff operations if it doesn't exist. Also ensure a minimal member_users entry exists
                await membersPool.query(
                    `INSERT INTO users (user_id, user_name, user_email, user_role, user_password)
                     VALUES ($1, 'Staff Portal System', 'system@staffportal.local', 'admin', 'system-hash')
                     ON CONFLICT (user_id) DO NOTHING`,
                    [SYSTEM_USER_ID]
                );
                try {
                    await membersPool.query(
                        `INSERT INTO member_users (user_id, user_name, user_email, member_number, is_active, created_at)
                         VALUES ($1, 'Staff Portal System', 'system@staffportal.local', 'SYSTEM', true, NOW())
                         ON CONFLICT (user_id) DO NOTHING`,
                        [SYSTEM_USER_ID]
                    );
                } catch (muErr) {
                    console.warn('Could not create system entry in member_users (non-fatal):', muErr.message || muErr);
                }

                reviewerId = SYSTEM_USER_ID;
                reviewerNotes = `${reviewerNotes} (Decision made by staff portal manager: ${manager_id})`;
            }
            
            // Insert review history
            await membersPool.query(
                `INSERT INTO loan_review_history (application_id, reviewer_id, reviewer_role, action_taken, notes)
                 VALUES ($1, $2, 'manager', $3, $4)`,
                [id, reviewerId, action, reviewerNotes]
            );
            
        } catch (historyError) {
            console.error('Error adding to review history:', historyError);
            // Don't fail the main operation if history insertion fails
        }
        
        // Prepare notification title/message so both DB insert and socket emit can reuse them.
        const application = result.rows[0];
        const memberNumber = application.member_number || application.applicants_membership_number || null;
        let title = action === 'approve' ? 'Loan Approved' : 'Loan Rejected';
        let message = action === 'approve'
            ? `Your loan application #${id} has been approved. Please check your account for details.`
            : `Your loan application #${id} has been rejected. Please contact support for details.`;

        // Try to create an in-app notification for the member (best-effort)
        try {
            if (memberNumber) {
                // Attempt to insert into a `member_notifications` table if it exists.
                // This is best-effort: if the table or columns don't exist, log and continue.
                const notifQuery = `
                    INSERT INTO member_notifications (member_number, application_id, title, message, is_read, created_at)
                    VALUES ($1, $2, $3, $4, false, NOW())
                `;
                await membersPool.query(notifQuery, [memberNumber, id, title, message]);
            }
        } catch (notifErr) {
            console.warn('Member notification insert failed (non-fatal):', notifErr.message || notifErr);
        }

        // Emit a socket event so member clients can receive immediate notification (best-effort)
        try {
            if (memberNumber && global && global.staffIo) {
                try {
                    global.staffIo.emit('loan-approved', {
                        application_id: application.application_id || id,
                        member_number: memberNumber,
                        title: title || (action === 'approve' ? 'Loan Approved' : 'Loan Update'),
                        message: message || '' ,
                        application
                    });
                    console.log('Emitted loan-approved socket for member', memberNumber);
                } catch (e) {
                    console.warn('Failed to emit loan-approved socket:', e && e.message ? e.message : e);
                }
            }
        } catch (e) {
            // non-fatal
        }

        res.json({
            success: true,
            message: `Application ${action}d successfully`,
            application: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error approving application:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving application'
        });
    }
});

// Get review statistics
router.get('/statistics', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_applications,
                COUNT(CASE WHEN review_status = 'pending_review' THEN 1 END) as pending_review,
                COUNT(CASE WHEN review_status = 'under_review' THEN 1 END) as under_review,
                COUNT(CASE WHEN review_status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN review_status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN review_status = 'returned' THEN 1 END) as returned
            FROM loan_applications
        `;
        
        const result = await membersPool.query(statsQuery);
        
        res.json({
            success: true,
            statistics: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

// Get loan officers for assignment
router.get('/loan-officers', async (req, res) => {
    try {
        const query = `
            SELECT user_id, user_name, user_email
            FROM users 
            WHERE user_role = 'loan_officer'
            ORDER BY user_name
        `;
        
        const result = await membersPool.query(query);
        
        res.json({
            success: true,
            loan_officers: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching loan officers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching loan officers'
        });
    }
});

module.exports = router;

// --- Notifications helper endpoint (for member-facing polling) ---
// GET /notifications/member/:member_number
router.get('/notifications/member/:member_number', async (req, res) => {
    try {
        const { member_number } = req.params;
        const notifQuery = `
            SELECT id, member_number, application_id, title, message, is_read, metadata, created_at
            FROM member_notifications
            WHERE member_number = $1
            ORDER BY created_at DESC
            LIMIT 100
        `;
        const result = await membersPool.query(notifQuery, [member_number]);
        res.json({ success: true, notifications: result.rows });
    } catch (err) {
        console.error('Error fetching member notifications:', err);
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
});
