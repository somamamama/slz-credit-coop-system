const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'credit_coop_system',
    port: process.env.DB_PORT || 3306
};

async function setupLoanApplicationsTable() {
    console.log('Setting up loan_applications table...');
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Read and execute the SQL schema file
        const schemaPath = path.join(__dirname, '..', 'loan_applications_table_schema.sql');
        const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sqlSchema.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing SQL statement...');
                await connection.execute(statement);
            }
        }
        
        console.log('✅ Loan applications table setup completed successfully!');
        
        // Verify the table was created
        const [rows] = await connection.execute('DESCRIBE loan_applications');
        console.log('\n📋 Table structure:');
        console.table(rows);
        
    } catch (error) {
        console.error('❌ Error setting up table:', error.message);
        console.error(error);
    } finally {
        await connection.end();
    }
}

// Run if called directly
if (require.main === module) {
    setupLoanApplicationsTable().then(() => {
        console.log('Setup completed.');
        process.exit(0);
    }).catch((error) => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = { setupLoanApplicationsTable };