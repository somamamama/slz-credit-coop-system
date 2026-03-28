const Pool = require('pg').Pool;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'slz_coop_staff',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
});

module.exports = pool;
