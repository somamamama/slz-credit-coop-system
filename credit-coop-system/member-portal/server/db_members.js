const Pool = require('pg').Pool;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'slz_coop_staff',
  password: 'password',
  port: 5432,
});
module.exports = pool;