const Pool = require('pg').Pool;

const pool = new Pool({
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    database: 'slz_coop_staff',
    port: 5432,
});

module.exports = pool;
