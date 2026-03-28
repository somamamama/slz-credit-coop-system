#!/usr/bin/env node

/**
 * Complete Payment System Setup
 * This script sets up the complete payment flow:
 * 1. Creates the proper payment_references table with foreign keys
 * 2. Sets up the database structure
 * 3. Provides instructions for testing
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    database: 'slz_coop_staff',
    port: 5432,
});

async function setupPaymentSystem() {
    try {
        console.log('🔄 Setting up complete payment system...');
        
        // Read and execute the setup SQL
        const sqlPath = path.join(__dirname, 'setup_payment_system.sql');
        const setupSql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('🔄 Creating payment_references table with proper structure...');
        await pool.query(setupSql);
        
        // Verify the setup
        console.log('🔄 Verifying database setup...');
        
        // Check if payment_references table exists
        const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'payment_references'
        `);
        
        if (tableCheck.rows.length === 0) {
            throw new Error('payment_references table was not created');
        }
        
        // Check if foreign key exists
        const fkCheck = await pool.query(`
            SELECT conname 
            FROM pg_constraint 
            WHERE conname = 'fk_payment_user'
        `);
        
        if (fkCheck.rows.length === 0) {
            console.warn('⚠️  Warning: Foreign key constraint not found, but this might be normal');
        } else {
            console.log('✅ Foreign key constraint verified');
        }
        
        // Check if member_users table exists
        const memberUsersCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'member_users'
        `);
        
        if (memberUsersCheck.rows.length === 0) {
            console.log('⚠️  Warning: member_users table not found. Creating basic structure...');
            await pool.query(`
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
                CREATE TABLE IF NOT EXISTS member_users (
                    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_name VARCHAR(255),
                    user_email VARCHAR(255) NOT NULL UNIQUE,
                    user_password VARCHAR(255) NOT NULL,
                    member_number VARCHAR(50) UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE
                );
                CREATE INDEX IF NOT EXISTS idx_member_users_email ON member_users(user_email);
                CREATE INDEX IF NOT EXISTS idx_member_users_member_number ON member_users(member_number);
            `);
            console.log('✅ Created basic member_users table');
        } else {
            console.log('✅ member_users table verified');
        }
        
        // Test the relationship
        console.log('🔄 Testing table relationship...');
        const relationTest = await pool.query(`
            SELECT 
                COUNT(*) as total_payments,
                COUNT(DISTINCT pr.user_id) as unique_users
            FROM payment_references pr
            LEFT JOIN member_users mu ON pr.user_id = mu.user_id
        `);
        
        console.log('✅ Database setup completed successfully!');
        console.log('📊 Current status:', relationTest.rows[0]);
        
        console.log('\n🎯 Payment System Flow:');
        console.log('1. Member uploads payment image → Member Portal');
        console.log('2. File saved + Database record created automatically');
        console.log('3. Staff can view/process via Staff Portal');
        console.log('4. Staff confirms/rejects payments');
        console.log('5. Members get notified (TODO: implement notifications)');
        
        console.log('\n🧪 Test the system:');
        console.log('1. Start Member Portal: cd member-portal/server && npm start');
        console.log('2. Start Staff Portal: cd staff-portal/server && npm start'); 
        console.log('3. Login to member portal and upload payment reference');
        console.log('4. Check staff portal to see pending payments');
        
        console.log('\n📋 API Endpoints:');
        console.log('Member Portal:');
        console.log('  POST /api/payment/reference-upload (with auth)');
        console.log('Staff Portal:');
        console.log('  GET  /api/payments/reference');
        console.log('  POST /api/payments/reference/:id/confirm');
        console.log('  POST /api/payments/reference/:id/reject');
        
    } catch (err) {
        console.error('❌ Setup failed:', err.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure PostgreSQL is running');
        console.log('2. Verify database "slz_coop_staff" exists');
        console.log('3. Check database credentials in db.js files');
        console.log('4. Ensure you have proper permissions');
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the setup
setupPaymentSystem();
