const Pool = require('pg').Pool;

const pool = new Pool({
    user: process.env.DB_USER || 'slz_app',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'slz_coop_staff',
    port: process.env.DB_PORT || 5432,
});

module.exports = pool;
