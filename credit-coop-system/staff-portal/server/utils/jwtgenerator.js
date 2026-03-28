const jwt = require('jsonwebtoken');
require('dotenv').config();

function jwtgenerator(user_id, user_role) {
    const payload = {
        user: {
            id: user_id,
            role: user_role
        }
    }
    const jwtSecret = process.env.jwt_secret || 'default_jwt_secret_for_development_only_change_in_production';
    return jwt.sign(payload, jwtSecret, { expiresIn: '1hr' });
}

module.exports = jwtgenerator;