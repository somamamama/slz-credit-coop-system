const { Pool } = require('pg');

// Staff portal database connection
const staffPool = new Pool({
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    database: 'slz_coop_staff',
    port: 5432,
});

// Members database connection
const membersPool = new Pool({
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    database: 'slz_members',
    port: 5432,
});

async function syncStaffUsers() {
    try {
        console.log('Starting staff user synchronization...');
        
        // Get all staff users from the staff portal database
        const staffUsersQuery = `
            SELECT user_id, user_name, user_email, user_role, user_password
            FROM users 
            WHERE user_role IN ('manager', 'loan_officer', 'admin')
        `;
        
        const staffUsers = await staffPool.query(staffUsersQuery);
        console.log(`Found ${staffUsers.rows.length} staff users to sync`);
        
        for (const staffUser of staffUsers.rows) {
            // Check if user already exists in members database
            const existingUser = await membersPool.query(
                'SELECT user_id FROM users WHERE user_id = $1',
                [staffUser.user_id]
            );
            
            if (existingUser.rows.length === 0) {
                // Insert the staff user into the members database
                await membersPool.query(
                    `INSERT INTO users (user_id, user_name, user_email, user_role, user_password)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (user_id) DO UPDATE SET
                        user_name = EXCLUDED.user_name,
                        user_email = EXCLUDED.user_email,
                        user_role = EXCLUDED.user_role`,
                    [
                        staffUser.user_id,
                        staffUser.user_name,
                        staffUser.user_email,
                        staffUser.user_role,
                        staffUser.user_password
                    ]
                );
                console.log(`Synced staff user: ${staffUser.user_name} (${staffUser.user_role})`);
            } else {
                console.log(`Staff user already exists: ${staffUser.user_name}`);
            }
        }
        
        console.log('Staff user synchronization completed successfully!');
        
    } catch (error) {
        console.error('Error during staff user synchronization:', error);
    } finally {
        await staffPool.end();
        await membersPool.end();
    }
}

// Run the synchronization
syncStaffUsers();
