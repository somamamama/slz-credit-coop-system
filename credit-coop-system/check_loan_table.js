const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'slz_coop_staff',
  password: 'password',
  port: 5432,
});

async function checkLoanTable() {
  try {
    // Check if table exists and its structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'loan_applications' 
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('Table loan_applications does not exist');
    } else {
      console.log('Current loan_applications table structure:');
      result.rows.forEach(row => {
        console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    }
  } catch (err) {
    console.error('Error checking table:', err);
  } finally {
    await pool.end();
  }
}

checkLoanTable();