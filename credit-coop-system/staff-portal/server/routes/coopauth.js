const router = require('express').Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwtgenerator = require('../utils/jwtgenerator');
const validinfo = require('../middleware/validation');
const authorization = require('../middleware/authorization');
//register 

router.post('/register', validinfo, async (req, res) => {
    try {
        
        //1. destructure the req.body (name, email, password)

        const { name, email, password } = req.body;

        //2. check if user exists (if exists throw error)
       
        const user = await pool.query("SELECT * FROM users WHERE user_email = $1", [email]);
        
        if (user.rows.length !== 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        //3. bcrypt the password

        const saltRound = 10;
        const gensalt = await bcrypt.genSalt(saltRound);
        const bcryptPassword = await bcrypt.hash(password, gensalt);
        
        //4. enter the new user inside our db
        const newUser = await pool.query(
            "INSERT INTO users (user_name, user_email, user_password, user_role) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, bcryptPassword, 'cashier'] // Default role is cashier
        );

        //5. generate jwt token
        const token = jwtgenerator(newUser.rows[0].user_id, newUser.rows[0].user_role);
        return res.json({ token, user: { id: newUser.rows[0].user_id, name: newUser.rows[0].user_name, email: newUser.rows[0].user_email, role: newUser.rows[0].user_role } });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}); 

//login route
router.post('/login', validinfo, async (req, res) => {
    try {
        console.log('LOGIN DEBUG headers=', JSON.stringify(req.headers || {}));
        console.log('LOGIN DEBUG body=', JSON.stringify(req.body || {}));
        // Accept either employee_number (snake_case or camelCase) or email for login
        const { email, employee_number, employeeNumber, password } = req.body;
        const empNum = employee_number || employeeNumber;

        let userRes;
        if (empNum) {
            userRes = await pool.query("SELECT * FROM users WHERE employee_number = $1", [empNum]);
        } else {
            userRes = await pool.query("SELECT * FROM users WHERE user_email = $1", [email]);
        }

        if (!userRes || userRes.rows.length === 0) {
            return res.status(401).json({ error: "Password or credentials are incorrect" });
        }

        const userRow = userRes.rows[0];
        const validPassword = await bcrypt.compare(password, userRow.user_password);
        if (!validPassword) {
            return res.status(401).json({ error: "Password or credentials are incorrect" });
        }

        const token = jwtgenerator(userRow.user_id, userRow.user_role);
        return res.json({ 
            token,
            user: {
                id: userRow.user_id,
                name: userRow.user_name,
                email: userRow.user_email,
                employee_number: userRow.employee_number || null,
                role: userRow.user_role
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/is-verify', authorization, async (req, res) => {
    try {
        res.json(true);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get user profile with role information
router.get('/profile', authorization, async (req, res) => {
    try {
        const userId = typeof req.user === 'object' ? req.user.id : req.user;
            const user = await pool.query("SELECT user_id, user_name, user_email, user_role, employee_number FROM users WHERE user_id = $1", [userId]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.json({
            id: user.rows[0].user_id,
            name: user.rows[0].user_name,
            email: user.rows[0].user_email,
            employee_number: user.rows[0].employee_number || null,
            role: user.rows[0].user_role
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;  