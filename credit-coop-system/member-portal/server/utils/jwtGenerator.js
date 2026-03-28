const jwt = require('jsonwebtoken');
require('dotenv').config();

function jwtGenerator(user_id) {
    const payload = {
        user: user_id
    };

    // Use environment variable or fallback to a default secret
    const jwtSecret = process.env.jwtSecret || 'default_jwt_secret_for_development_only_change_in_production';
    
    return jwt.sign(payload, jwtSecret, { expiresIn: '1hr' });
}

module.exports = jwtGenerator;