const express = require('express');
const router = express.Router();
const staffAuthorize = require('../middleware/authorization');
const { Pool } = require('pg');

const membersPool = new Pool({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  database: 'slz_coop_staff',
  port: 5432
});

// Ensure member_accounts table exists (best-effort)
async function ensureAccountsTable() {
  try {
    await membersPool.query(`
      CREATE TABLE IF NOT EXISTS member_accounts (
        account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        member_number VARCHAR(50) NOT NULL,
        account_type VARCHAR(50) NOT NULL,
        balance NUMERIC(18,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (e) {
    console.warn('Could not ensure member_accounts table:', e.message || e);
  }
}
ensureAccountsTable();

// Create a savings (or other) account for a member
router.post('/create', staffAuthorize, async (req, res) => {
  try {
    const { member_number, initial_deposit = 0, account_type = 'savings' } = req.body || {};
    if (!member_number) return res.status(400).json({ success: false, message: 'member_number required' });

    // Verify member exists
    const mRes = await membersPool.query('SELECT member_number FROM member_users WHERE member_number = $1', [member_number]);
    if (mRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Member not found' });

    const insert = await membersPool.query(
      `INSERT INTO member_accounts (member_number, account_type, balance) VALUES ($1, $2, $3) RETURNING *`,
      [member_number, account_type, Number(initial_deposit) || 0]
    );

    return res.json({ success: true, account: insert.rows[0] });
  } catch (err) {
    console.error('Error creating account:', err);
    return res.status(500).json({ success: false, message: 'Failed to create account' });
  }
});

module.exports = router;
