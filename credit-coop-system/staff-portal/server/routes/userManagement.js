const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const staffAuthorize = require('../middleware/authorization');
const membersPool = require('../db_members');

// Ensure member_users table schema exists
async function ensureMemberUsersSchema() {
    try {
        // Check if member_users table exists
        const tableCheck = await membersPool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_name = 'member_users'
        `);
        
        if (tableCheck.rows.length === 0) {
            console.log('Creating member_users table...');
            await membersPool.query(`
                CREATE TABLE member_users (
                    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_name VARCHAR(255) NOT NULL,
                    user_email VARCHAR(255) NOT NULL UNIQUE,
                    user_password VARCHAR(255) NOT NULL,
                    member_number VARCHAR(50) UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE
                )
            `);
            
            // Create indexes
            await membersPool.query(`CREATE INDEX idx_member_users_email ON member_users(user_email)`);
            await membersPool.query(`CREATE INDEX idx_member_users_member_number ON member_users(member_number)`);
            await membersPool.query(`CREATE INDEX idx_member_users_active ON member_users(is_active)`);
        }
    } catch (e) {
        console.error('Error ensuring member_users schema', e);
    }
}

ensureMemberUsersSchema();

// IT Admin: Get all members with pagination and search
router.get('/members', staffAuthorize, async (req, res) => {
    try {
        // Only allow it_admin role
        const role = req.user?.role;
        if (role !== 'it_admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '';
        let queryParams = [];
        
        if (search) {
            whereClause += `WHERE (user_name ILIKE $1 OR user_email ILIKE $1 OR member_number ILIKE $1)`;
            queryParams.push(`%${search}%`);
        }
        
        if (status !== 'all') {
            const statusCondition = status === 'active' ? 'is_active = true' : 'is_active = false';
            whereClause += whereClause ? ` AND ${statusCondition}` : `WHERE ${statusCondition}`;
        }
        
        // Get total count
        const countQuery = `SELECT COUNT(*) FROM member_users ${whereClause}`;
        const countResult = await membersPool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].count);
        
        // Get members with pagination
        const membersQuery = `
            SELECT user_id, user_name, user_email, member_number, created_at, updated_at, is_active
            FROM member_users 
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;
        
        const membersResult = await membersPool.query(membersQuery, [...queryParams, limit, offset]);
        
        return res.json({
            success: true,
            members: membersResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalMembers: total,
                limit: parseInt(limit)
            }
        });
    } catch (err) {
        console.error('Error fetching members:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch members' });
    }
});

// Any authenticated staff: lightweight endpoint to get total members count
// This is intentionally permissive (any staff role) so dashboards can display counts
router.get('/members/count', staffAuthorize, async (req, res) => {
    try {
        const countResult = await membersPool.query(`SELECT COUNT(*) FROM member_users`);
        const total = parseInt(countResult.rows[0].count, 10) || 0;
        return res.json({ success: true, totalMembers: total });
    } catch (err) {
        console.error('Error fetching members count:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch members count' });
    }
});

// IT Admin: Get single member by ID
router.get('/members/:id', staffAuthorize, async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'it_admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { id } = req.params;
        const result = await membersPool.query(
            `SELECT user_id, user_name, user_email, member_number, created_at, updated_at, is_active 
             FROM member_users WHERE user_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        return res.json({ success: true, member: result.rows[0] });
    } catch (err) {
        console.error('Error fetching member:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch member' });
    }
});

// IT Admin: Create member account
router.post('/members', staffAuthorize, async (req, res) => {
    try {
        // Only allow it_admin role
        const role = req.user?.role;
        if (role !== 'it_admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { member_number, default_password, member_name, user_email } = req.body;
        if (!member_number || !default_password || !user_email) {
            return res.status(400).json({ 
                success: false, 
                message: 'member_number, user_email, and default_password are required' 
            });
        }

        // Hash the password
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(default_password, salt);

        // Check duplicates
        const existing = await membersPool.query(
            `SELECT user_id FROM member_users WHERE member_number = $1 OR user_email = $2`,
            [member_number, user_email]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Member account already exists with this member number or email' });
        }

        // Use provided member_name or default to member_number if null/empty
        const finalMemberName = member_name || `Member ${member_number}`;

        const insert = await membersPool.query(
            `INSERT INTO member_users (user_name, user_email, user_password, member_number) 
             VALUES ($1, $2, $3, $4) RETURNING user_id, member_number, user_name, user_email, created_at, is_active`,
            [finalMemberName, user_email, hash, member_number]
        );

        return res.json({ success: true, member: insert.rows[0] });
    } catch (err) {
        console.error('Error creating member account:', err);
        
        // Provide more specific error messages
        if (err.code === '23502') {
            return res.status(400).json({ 
                success: false, 
                message: 'Required field missing. Please ensure all required fields are provided.',
                details: err.detail
            });
        } else if (err.code === '23505') {
            return res.status(409).json({ 
                success: false, 
                message: 'Member account already exists with this member number or email.'
            });
        }
        
        return res.status(500).json({ success: false, message: 'Failed to create member account' });
    }
});

// IT Admin: Update member account
router.put('/members/:id', staffAuthorize, async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'it_admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { id } = req.params;
        const { user_name, user_email, member_number, is_active, new_password } = req.body;

        // Check if member exists
        const existing = await membersPool.query(
            `SELECT user_id FROM member_users WHERE user_id = $1`,
            [id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        let updateFields = [];
        let updateValues = [];
        let paramCount = 1;

        if (user_name !== undefined) {
            updateFields.push(`user_name = $${paramCount}`);
            updateValues.push(user_name);
            paramCount++;
        }

        if (user_email !== undefined) {
            // Check if email is already taken by another user
            const emailCheck = await membersPool.query(
                `SELECT user_id FROM member_users WHERE user_email = $1 AND user_id != $2`,
                [user_email, id]
            );
            if (emailCheck.rows.length > 0) {
                return res.status(409).json({ success: false, message: 'Email already taken by another member' });
            }
            updateFields.push(`user_email = $${paramCount}`);
            updateValues.push(user_email);
            paramCount++;
        }

        if (member_number !== undefined) {
            // Check if member number is already taken by another user
            const memberNumberCheck = await membersPool.query(
                `SELECT user_id FROM member_users WHERE member_number = $1 AND user_id != $2`,
                [member_number, id]
            );
            if (memberNumberCheck.rows.length > 0) {
                return res.status(409).json({ success: false, message: 'Member number already taken by another member' });
            }
            updateFields.push(`member_number = $${paramCount}`);
            updateValues.push(member_number);
            paramCount++;
        }

        if (is_active !== undefined) {
            updateFields.push(`is_active = $${paramCount}`);
            updateValues.push(is_active);
            paramCount++;
        }

        if (new_password) {
            const saltRounds = 10;
            const salt = await bcrypt.genSalt(saltRounds);
            const hash = await bcrypt.hash(new_password, salt);
            updateFields.push(`user_password = $${paramCount}`);
            updateValues.push(hash);
            paramCount++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(id);

        const updateQuery = `
            UPDATE member_users 
            SET ${updateFields.join(', ')} 
            WHERE user_id = $${paramCount}
            RETURNING user_id, user_name, user_email, member_number, created_at, updated_at, is_active
        `;

        const result = await membersPool.query(updateQuery, updateValues);

        return res.json({ success: true, member: result.rows[0] });
    } catch (err) {
        console.error('Error updating member:', err);
        return res.status(500).json({ success: false, message: 'Failed to update member' });
    }
});

// IT Admin: Delete member account
router.delete('/members/:id', staffAuthorize, async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'it_admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { id } = req.params;

        // Check if member exists
        const existing = await membersPool.query(
            `SELECT user_id, user_name FROM member_users WHERE user_id = $1`,
            [id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        // Delete the member
        await membersPool.query(`DELETE FROM member_users WHERE user_id = $1`, [id]);

        return res.json({ 
            success: true, 
            message: `Member ${existing.rows[0].user_name} has been deleted successfully` 
        });
    } catch (err) {
        console.error('Error deleting member:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete member' });
    }
});

// IT Admin: Toggle member active status
router.patch('/members/:id/toggle-status', staffAuthorize, async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'it_admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const { id } = req.params;

        // Toggle the is_active status
        const result = await membersPool.query(
            `UPDATE member_users 
             SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = $1 
             RETURNING user_id, user_name, user_email, member_number, is_active`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        const member = result.rows[0];
        return res.json({ 
            success: true, 
            member,
            message: `Member ${member.user_name} has been ${member.is_active ? 'activated' : 'deactivated'}` 
        });
    } catch (err) {
        console.error('Error toggling member status:', err);
        return res.status(500).json({ success: false, message: 'Failed to toggle member status' });
    }
});

module.exports = router;


