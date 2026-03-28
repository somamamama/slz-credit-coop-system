const router = require('express').Router();
const pool = require('../db_members');
const authorization = require('../middleware/authorization');

router.get('/', authorization, authorization, async (req, res) => {
    try {
        // Get user info
    const userResult = await pool.query("SELECT user_id, user_name, user_email, member_number FROM member_users WHERE user_id = $1", [req.user]);
    const user = userResult.rows[0];

        if (!user) {
            console.log('No user found for user_id:', req.user);
            return res.status(404).json({ error: 'User not found' });
        }

        // Debug: print member_number
        console.log('Queried member_number:', user.member_number);

        // Get active loan for this member
        const loanResult = await pool.query(
            `SELECT amount, duration_months, review_status, application_id, monthly_payment
             FROM loan_applications
             WHERE member_number = $1 AND review_status = 'approved'
             ORDER BY submitted_at DESC LIMIT 1`,
            [user.member_number]
        );
        // Debug: print loan query result
        console.log('Loan query result:', loanResult.rows);
        user.loan = loanResult.rows[0] || null;

        // Fetch accounts (savings/checking) for this member from member_accounts
        try {
            const accountsRes = await pool.query(
                `SELECT account_id, member_number, account_type, balance, created_at
                 FROM member_accounts
                 WHERE member_number = $1`,
                [user.member_number]
            );

            // Map accounts by type for easier consumption by the frontend
            const accounts = {};
            for (const a of accountsRes.rows) {
                accounts[a.account_type] = {
                    accountId: a.account_id,
                    accountNumber: a.account_id, // fallback to id; adjust if you have a separate account number
                    balance: Number(a.balance) || 0,
                    createdAt: a.created_at
                };
            }

            user.accounts = accounts;
        } catch (acctErr) {
            console.warn('Could not load member accounts for dashboard:', acctErr.message || acctErr);
            user.accounts = {};
        }

        // Provide an empty recentTransactions array if none exists yet
        if (!user.recentTransactions) user.recentTransactions = [];

        res.json(user);
    } catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;