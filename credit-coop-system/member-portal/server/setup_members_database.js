#!/usr/bin/env node
/**
 * Setup script for the members database and loan application system
 * This script ensures the correct database structure and connection settings
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// Database configuration for staff database
const membersPool = new Pool({
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    database: 'slz_coop_staff',
    port: 5432,
});

async function setupMembersDatabase() {
    try {
        console.log('🔄 Setting up staff database for loan application system...');
        
        // Read and execute the SQL setup script
        const sqlPath = path.join(__dirname, 'setup_members_database.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute SQL statements individually to handle complex statements properly
        console.log('🔄 Creating database tables and functions...');
        
        // Create extension
        await membersPool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        
        // Create member_users table
        await membersPool.query(`
            CREATE TABLE IF NOT EXISTS member_users (
                user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_name VARCHAR(255),
                user_email VARCHAR(255) NOT NULL UNIQUE,
                user_password VARCHAR(255) NOT NULL,
                member_number VARCHAR(50) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        `);
        
        // Create indexes for member_users
        await membersPool.query('CREATE INDEX IF NOT EXISTS idx_member_users_email ON member_users(user_email)');
        await membersPool.query('CREATE INDEX IF NOT EXISTS idx_member_users_member_number ON member_users(member_number)');
        await membersPool.query('CREATE INDEX IF NOT EXISTS idx_member_users_active ON member_users(is_active)');
        
        // Create loan_applications table
        await membersPool.query(`
            CREATE TABLE IF NOT EXISTS loan_applications (
                application_id SERIAL PRIMARY KEY,
                user_id UUID NOT NULL,
                application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                jpg_file_path VARCHAR(500) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES member_users(user_id) ON DELETE CASCADE
            )
        `);
        
        // Create indexes for loan_applications
        await membersPool.query('CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id)');
        await membersPool.query('CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status)');
        await membersPool.query('CREATE INDEX IF NOT EXISTS idx_loan_applications_submitted_at ON loan_applications(submitted_at)');
        
        // Create trigger function
        await membersPool.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $trigger_function$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $trigger_function$ language 'plpgsql'
        `);
        
        // Drop and recreate trigger
        await membersPool.query('DROP TRIGGER IF EXISTS update_member_users_updated_at ON member_users');
        await membersPool.query(`
            CREATE TRIGGER update_member_users_updated_at 
            BEFORE UPDATE ON member_users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column()
        `);
        
        console.log('✅ Database tables created successfully!');
        
        // Check if member accounts exist
        const existingMembers = await membersPool.query('SELECT COUNT(*) FROM member_users');
        const memberCount = parseInt(existingMembers.rows[0].count);
        
        // Check if we need to migrate existing loan applications from slz_coop_staff
        console.log('🔄 Checking for existing loan applications to migrate...');
        
        const staffPool = new Pool({
            user: 'postgres',
            password: 'password',
            host: 'localhost',
            database: 'slz_coop_staff',
            port: 5432,
        });
        
        try {
            // Check if loan_applications table exists in staff database
            const staffTables = await staffPool.query(`
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'loan_applications'
            `);
            
            if (staffTables.rows.length > 0) {
                // Get existing loan applications from staff database
                const existingApps = await staffPool.query('SELECT * FROM loan_applications ORDER BY submitted_at');
                
                if (existingApps.rows.length > 0) {
                    console.log(`📋 Found ${existingApps.rows.length} existing loan application(s) to migrate`);
                    
                    // Check if applications already exist in members database
                    const currentApps = await membersPool.query('SELECT COUNT(*) FROM loan_applications');
                    const currentCount = parseInt(currentApps.rows[0].count);
                    
                    if (currentCount === 0) {
                        console.log('🔄 Migrating loan applications to members database...');
                        
                        for (const app of existingApps.rows) {
                            // Check if the user_id exists in member_users table
                            const userExists = await membersPool.query(
                                'SELECT user_id FROM member_users WHERE user_id = $1',
                                [app.user_id]
                            );
                            
                            if (userExists.rows.length > 0) {
                                // Migrate the application
                                await membersPool.query(`
                                    INSERT INTO loan_applications 
                                    (user_id, application_date, jpg_file_path, status, submitted_at)
                                    VALUES ($1, $2, $3, $4, $5)
                                `, [
                                    app.user_id,
                                    app.application_date,
                                    app.jpg_file_path,
                                    app.status,
                                    app.submitted_at
                                ]);
                                console.log(`   ✅ Migrated application ${app.application_id} for user ${app.user_id}`);
                            } else {
                                console.log(`   ⚠️  Skipped application ${app.application_id} - user ${app.user_id} not found in member_users`);
                            }
                        }
                        console.log('✅ Migration completed!');
                    } else {
                        console.log(`ℹ️  Loan applications already exist in members database (${currentCount} records)`);
                    }
                } else {
                    console.log('ℹ️  No loan applications found to migrate');
                }
            }
        } catch (migrationError) {
            console.log('⚠️  Migration check failed (this is normal if staff database structure is different)');
            console.log(`   ${migrationError.message}`);
        } finally {
            await staffPool.end();
        }
        
        // Create member accounts for existing loan applications if needed
        if (memberCount === 0) {
            console.log('🔄 Creating member accounts based on existing loan applications...');
            
            // Check for existing loan applications in staff database first
            try {
                const staffPool = new Pool({
                    user: 'postgres',
                    password: 'password',
                    host: 'localhost',
                    database: 'slz_coop_staff',
                    port: 5432,
                });
                
                const existingApps = await staffPool.query('SELECT DISTINCT user_id FROM loan_applications');
                
                if (existingApps.rows.length > 0) {
                    console.log(`📋 Found loan applications for ${existingApps.rows.length} user(s)`);
                    
                    // Create member accounts for each user_id found in loan applications
                    const saltRounds = 10;
                    let memberCounter = 1;
                    
                    for (const app of existingApps.rows) {
                        const tempPassword = 'temp123';
                        const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);
                        const memberNumber = `M-${memberCounter.toString().padStart(3, '0')}`;
                        const tempEmail = `member${memberCounter}@temp.com`;
                        
                        await membersPool.query(`
                            INSERT INTO member_users (user_id, user_name, user_email, user_password, member_number, is_active)
                            VALUES ($1, $2, $3, $4, $5, $6)
                        `, [
                            app.user_id,
                            `Member ${memberCounter}`,
                            tempEmail,
                            hashedPassword,
                            memberNumber,
                            true
                        ]);
                        
                        console.log(`   ✅ Created member account: ${memberNumber} (${tempEmail}) for user_id: ${app.user_id}`);
                        memberCounter++;
                    }
                } else {
                    // Create default test member if no existing applications
                    const hashedPassword = await bcrypt.hash('member123', saltRounds);
                    
                    await membersPool.query(`
                        INSERT INTO member_users (user_name, user_email, user_password, member_number, is_active)
                        VALUES ($1, $2, $3, $4, $5)
                    `, ['Test Member', 'member@test.com', hashedPassword, 'M-001', true]);
                    
                    console.log('✅ Test member account created:');
                    console.log('   Email: member@test.com');
                    console.log('   Password: member123');
                    console.log('   Member Number: M-001');
                }
                
                await staffPool.end();
                
            } catch (error) {
                console.log('⚠️  Could not check staff database, creating default test member...');
                
                // Create default test member
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash('member123', saltRounds);
                
                await membersPool.query(`
                    INSERT INTO member_users (user_name, user_email, user_password, member_number, is_active)
                    VALUES ($1, $2, $3, $4, $5)
                `, ['Test Member', 'member@test.com', hashedPassword, 'M-001', true]);
                
                console.log('✅ Test member account created:');
                console.log('   Email: member@test.com');
                console.log('   Password: member123');
                console.log('   Member Number: M-001');
            }
        } else {
            console.log(`ℹ️  Found ${memberCount} existing member(s) in database`);
        }
        
        // Test the loan application service configuration
        console.log('🔄 Testing loan application service configuration...');
        
        // Check if loan_applications table exists and is properly linked
        const testQuery = `
            SELECT mu.user_name, mu.member_number, COUNT(la.application_id) as application_count
            FROM member_users mu
            LEFT JOIN loan_applications la ON mu.user_id = la.user_id
            GROUP BY mu.user_id, mu.user_name, mu.member_number
            LIMIT 5
        `;
        
        const testResult = await membersPool.query(testQuery);
        console.log('✅ Database relationships verified');
        
        if (testResult.rows.length > 0) {
            console.log('📊 Member summary:');
            testResult.rows.forEach(row => {
                console.log(`   - ${row.user_name} (${row.member_number}): ${row.application_count} application(s)`);
            });
        }
        
        console.log('\n🎉 Staff database setup completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Start your member portal server');
        console.log('2. Members can now submit loan applications');
        console.log('3. Applications are stored in the loan_applications table');
        console.log('4. Staff can review applications through staff portal');
        
    } catch (error) {
        console.error('❌ Error setting up staff database:', error.message);
        console.error('\n🔧 Troubleshooting tips:');
        console.error('1. Make sure PostgreSQL is running');
        console.error('2. Verify the slz_coop_staff database exists');
        console.error('3. Check database credentials in the script');
        console.error('4. Ensure you have proper permissions');
        process.exit(1);
    } finally {
        await membersPool.end();
    }
}

// Check if being run directly
if (require.main === module) {
    setupMembersDatabase();
}

module.exports = { setupMembersDatabase };
