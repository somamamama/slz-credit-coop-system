const pool = require('./db');
const bcrypt = require('bcrypt');

const updateDatabaseSchema = async () => {
    try {
        console.log('Starting database migration...');

        // Add role column to users table if it doesn't exist
        console.log('Adding user_role column...');
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) NOT NULL DEFAULT 'cashier',
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);

        // Check if test users already exist
        const existingUsers = await pool.query("SELECT user_email FROM users");
        const existingEmails = existingUsers.rows.map(row => row.user_email);

        // Hash password for test users
        const saltRound = 10;
        const gensalt = await bcrypt.genSalt(saltRound);
        const hashedPassword = await bcrypt.hash('password123', gensalt);

        // Test users to insert
        const testUsers = [
            ['Admin User', 'admin@creditcoop.com', hashedPassword, 'admin'],
            ['Manager User', 'manager@creditcoop.com', hashedPassword, 'manager'],
            ['Loan Officer', 'loanofficer@creditcoop.com', hashedPassword, 'loan_officer'],
            ['Cashier User', 'cashier@creditcoop.com', hashedPassword, 'cashier'],
            ['IT Admin', 'itadmin@creditcoop.com', hashedPassword, 'it_admin']
        ];

        // Insert test users if they don't exist
        for (const [name, email, password, role] of testUsers) {
            if (!existingEmails.includes(email)) {
                console.log(`Creating user: ${email} with role: ${role}`);
                await pool.query(
                    "INSERT INTO users (user_name, user_email, user_password, user_role) VALUES ($1, $2, $3, $4)",
                    [name, email, password, role]
                );
            } else {
                console.log(`User ${email} already exists, updating role to ${role}...`);
                await pool.query(
                    "UPDATE users SET user_role = $1 WHERE user_email = $2",
                    [role, email]
                );
            }
        }

        console.log('Database migration completed successfully!');
        console.log('\nTest users available:');
        console.log('- admin@creditcoop.com (password: password123) - Admin Dashboard');
        console.log('- manager@creditcoop.com (password: password123) - Manager Dashboard');
        console.log('- loanofficer@creditcoop.com (password: password123) - Loan Officer Dashboard');
        console.log('- cashier@creditcoop.com (password: password123) - Cashier Dashboard');
        console.log('- itadmin@creditcoop.com (password: password123) - IT Admin Dashboard');

    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        pool.end();
    }
};

updateDatabaseSchema();
