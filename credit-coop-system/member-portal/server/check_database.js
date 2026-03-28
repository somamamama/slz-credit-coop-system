const pool = require('./db_members');

async function checkDatabase() {
    try {
        console.log('Checking database connection...');
        
        // Test connection
        const connectionTest = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Database connection successful!');
        console.log('Current time:', connectionTest.rows[0].current_time);
        
        // Check if loan_applications table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'loan_applications'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('✅ loan_applications table exists');
            
            // Get table structure
            const structure = await pool.query(`
                SELECT 
                    column_name, 
                    data_type, 
                    is_nullable,
                    column_default
                FROM information_schema.columns 
                WHERE table_name = 'loan_applications' 
                ORDER BY ordinal_position
            `);
            
            console.log('\n📋 Current loan_applications table structure:');
            console.table(structure.rows);
            
            // Count existing records
            const count = await pool.query('SELECT COUNT(*) FROM loan_applications');
            console.log(`\n📊 Current records in loan_applications: ${count.rows[0].count}`);
            
        } else {
            console.log('❌ loan_applications table does NOT exist');
            console.log('You need to run the migration script to create the table.');
        }
        
        // Check member_users table structure to understand user_id type
        const memberUsersCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'member_users'
            );
        `);
        
        if (memberUsersCheck.rows[0].exists) {
            console.log('\n✅ member_users table exists');
            
            const userIdColumn = await pool.query(`
                SELECT 
                    column_name, 
                    data_type, 
                    is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'member_users' 
                AND column_name = 'user_id'
            `);
            
            if (userIdColumn.rows.length > 0) {
                console.log('👤 member_users.user_id type:', userIdColumn.rows[0].data_type);
            }
        } else {
            console.log('❌ member_users table does NOT exist');
        }
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
        console.error('Make sure PostgreSQL is running and the database exists.');
    } finally {
        await pool.end();
    }
}

checkDatabase();