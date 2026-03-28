const router = require('express').Router();
const pool = require('../db_members');
const bcrypt = require('bcrypt');
const jwtGenerator = require('../utils/jwtGenerator');
const validation = require('../middleware/validation');
const authorization = require('../middleware/authorization');

router.post('/register', validation, async (req, res) => {
    try {
        // Member registration is disabled - accounts are created by IT Admin
        return res.status(403).json({ 
            message: "Member registration is disabled. Please contact your IT Administrator to create your account." 
        });
    } catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/login', validation, async (req, res) => {
    try {
        // 1. Get user input - accepting both email and memberNumber
        const { email, memberNumber, password } = req.body;
        const loginField = email || memberNumber;

        // 2. Validate user input
        if (!(loginField && password)){
            return res.status(400).send("Member number/email and password are required");
        }

        // 3. Check if user exists in member_users table (check both email and member number fields)
        let user;
        if (email) {
            user = await pool.query("SELECT * FROM member_users WHERE user_email = $1 AND is_active = true", [email]);
        } else {
            // Check by member number
            user = await pool.query("SELECT * FROM member_users WHERE member_number = $1 AND is_active = true", [memberNumber]);
        }

        if (user.rows.length === 0){
            return res.status(400).send("User does not exist or account is inactive");
        }

        // 4. Check if password is correct
        const validPassword = await bcrypt.compare(password, user.rows[0].user_password);

        if (!validPassword){
            return res.status(400).send("Invalid Password");
        }

        // 5. Generate JWT token
        const token = jwtGenerator(user.rows[0].user_id);
        res.json({ token, user: user.rows[0] });
    } catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/is-verify', authorization, async (req, res) => {
    try {
        res.json(true);
    } catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;