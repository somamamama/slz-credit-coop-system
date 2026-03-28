const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    database: 'slz_coop_staff',
    port: 5432,
});

async function migratePaymentReferences() {
    try {
        console.log('🔄 Checking payment_references table structure...');
        
        // Check current table structure
        const tableInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'payment_references'
            ORDER BY ordinal_position
        `);
        
        console.log('Current table structure:');
        tableInfo.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Check if user_id column exists
        const hasUserId = tableInfo.rows.some(col => col.column_name === 'user_id');
        const hasMemberId = tableInfo.rows.some(col => col.column_name === 'member_id');
        
        if (hasUserId) {
            console.log('✅ Table already has user_id column - migration not needed');
            return;
        }
        
        console.log('🔄 Migrating payment_references table...');
        
        // Start transaction
        await pool.query('BEGIN');
        
        try {
            // Add user_id column
            console.log('Adding user_id column...');
            await pool.query(`
                ALTER TABLE payment_references 
                ADD COLUMN user_id UUID
            `);
            
            // If member_id exists and contains UUIDs, migrate data
            if (hasMemberId) {
                console.log('Migrating member_id data to user_id...');
                await pool.query(`
                    UPDATE payment_references 
                    SET user_id = CASE 
                        WHEN member_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                        THEN member_id::UUID
                        ELSE NULL
                    END
                `);
            }
            
            // Remove old columns that are no longer needed
            if (hasMemberId) {
                console.log('Removing old member_id column...');
                await pool.query('ALTER TABLE payment_references DROP COLUMN member_id');
            }
            
            const hasMemberName = tableInfo.rows.some(col => col.column_name === 'member_name');
            if (hasMemberName) {
                console.log('Removing old member_name column...');
                await pool.query('ALTER TABLE payment_references DROP COLUMN member_name');
            }
            
            // Add foreign key constraint if member_users table exists
            const memberUsersExists = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'member_users'
            `);
            
            if (memberUsersExists.rows.length > 0) {
                console.log('Adding foreign key constraint...');
                await pool.query(`
                    ALTER TABLE payment_references 
                    ADD CONSTRAINT fk_payment_user 
                    FOREIGN KEY (user_id) REFERENCES member_users(user_id) ON DELETE CASCADE
                `);
            } else {
                console.log('⚠️  Warning: member_users table not found, skipping foreign key constraint');
            }
            
            // Add indexes
            console.log('Adding indexes...');
            await pool.query('CREATE INDEX IF NOT EXISTS idx_payment_references_user_id ON payment_references(user_id)');
            await pool.query('CREATE INDEX IF NOT EXISTS idx_payment_references_status ON payment_references(status)');
            await pool.query('CREATE INDEX IF NOT EXISTS idx_payment_references_created_at ON payment_references(created_at)');
            
            await pool.query('COMMIT');
            console.log('✅ Migration completed successfully!');
            
        } catch (err) {
            await pool.query('ROLLBACK');
            throw err;
        }
        
        // Verify the new structure
        console.log('🔄 Verifying new structure...');
        const newTableInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'payment_references'
            ORDER BY ordinal_position
        `);
        
        console.log('New table structure:');
        newTableInfo.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.log('\n🔧 Manual SQL to run:');
        console.log(`
-- Connect to your PostgreSQL database and run:
ALTER TABLE payment_references ADD COLUMN user_id UUID;
ALTER TABLE payment_references DROP COLUMN IF EXISTS member_id;
ALTER TABLE payment_references DROP COLUMN IF EXISTS member_name;
ALTER TABLE payment_references ADD CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES member_users(user_id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_payment_references_user_id ON payment_references(user_id);
        `);
    } finally {
        await pool.end();
    }
}

// Run migration
migratePaymentReferences();
