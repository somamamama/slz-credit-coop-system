const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'slz_coop_staff',
  password: 'password',
  port: 5432,
});

async function updateLoanApplicationsTable() {
  try {
    console.log('Reading SQL file...');
    const sqlPath = path.join(__dirname, 'update_loan_applications_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL to update loan_applications table...');
    await pool.query(sql);
    
    console.log('✅ Successfully updated loan_applications table structure');
    
    // Verify the new structure
    console.log('\nNew table structure:');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'loan_applications' 
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
  } catch (err) {
    console.error('❌ Error updating table:', err);
  } finally {
    await pool.end();
  }
}

updateLoanApplicationsTable();