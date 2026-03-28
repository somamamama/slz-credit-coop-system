const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = async (req, res, next) => { 
    try {
        const jwtToken = req.header("token");

        if (!jwtToken) {
            return res.status(403).json("Not authorized");
        }

        const jwtSecret = process.env.jwt_secret || 'default_jwt_secret_for_development_only_change_in_production';
        const payload = jwt.verify(jwtToken, jwtSecret);
        req.user = payload.user;
        next();

    } catch (err) {
        console.error(err.message);
        return res.status(403).json("Not authorized");
    }
}
