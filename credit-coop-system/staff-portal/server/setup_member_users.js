const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration for member database
const pool = new Pool({
    user: process.env.DB_USER || 'slz_app',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'slz_coop_staff',
    port: process.env.DB_PORT || 5432,
});

async function setupMemberUsersTable() {
    try {
        console.log('Setting up member_users table...');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'setup_member_users.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute the SQL
        await pool.query(sqlContent);
        
        console.log('✅ member_users table setup completed successfully!');
        console.log('The table includes:');
        console.log('- user_id (UUID, Primary Key)');
        console.log('- user_name (VARCHAR)');
        console.log('- user_email (VARCHAR, Unique)');
        console.log('- user_password (VARCHAR)');
        console.log('- member_number (VARCHAR, Unique)');
        console.log('- created_at (TIMESTAMP)');
        console.log('- updated_at (TIMESTAMP)');
        console.log('- is_active (BOOLEAN)');
        console.log('- Proper indexes and constraints');
        
    } catch (error) {
        console.error('❌ Error setting up member_users table:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the setup
setupMemberUsersTable();
