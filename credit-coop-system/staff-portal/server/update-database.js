const pool = require('./db');
const bcrypt = require('bcrypt');

async function updateDatabase() {
    try {
        console.log('Starting database update...');

        // Check if user_role column exists
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='user_role'
        `);

        if (checkColumn.rows.length === 0) {
            // Add user_role column
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN user_role VARCHAR(50) NOT NULL DEFAULT 'cashier',
                ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('Added user_role and created_at columns to users table');
        } else {
            console.log('user_role column already exists');
        }

        // Hash passwords for test users
        const saltRound = 10;
        const gensalt = await bcrypt.genSalt(saltRound);
        const hashedPassword = await bcrypt.hash('password123', gensalt);

        // Clear existing users first
        await pool.query('DELETE FROM users');
        
        // Insert test users with different roles
        const testUsers = [
            ['Admin User', 'admin@creditcoop.com', hashedPassword, 'admin'],
            ['Manager User', 'manager@creditcoop.com', hashedPassword, 'manager'],
            ['Loan Officer', 'loanofficer@creditcoop.com', hashedPassword, 'loan_officer'],
            ['Cashier User', 'cashier@creditcoop.com', hashedPassword, 'cashier'],
            ['IT Admin', 'itadmin@creditcoop.com', hashedPassword, 'it_admin']
        ];

        for (const user of testUsers) {
            await pool.query(
                'INSERT INTO users (user_name, user_email, user_password, user_role) VALUES ($1, $2, $3, $4)',
                user
            );
        }

        console.log('Test users created successfully:');
        console.log('- admin@creditcoop.com (Admin)');
        console.log('- manager@creditcoop.com (Manager)');
        console.log('- loanofficer@creditcoop.com (Loan Officer)');
        console.log('- cashier@creditcoop.com (Cashier)');
        console.log('- itadmin@creditcoop.com (IT Admin)');
        console.log('All passwords: password123');

        console.log('Database update completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error updating database:', err.message);
        process.exit(1);
    }
}

updateDatabase();
