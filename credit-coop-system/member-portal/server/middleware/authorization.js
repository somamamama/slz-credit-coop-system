const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {

    const jwtToken = req.header("token");
    if (!jwtToken) {
            return res.status(403).send("Authorization denied");
    }
    try {
        // Use environment variable or fallback to a default secret
        const jwtSecret = process.env.jwtSecret || 'default_jwt_secret_for_development_only_change_in_production';
        const payload = jwt.verify(jwtToken, jwtSecret);
        req.user = payload.user;
        next();
    } catch (err) {
        console.error(err.message);
        return res.status(401).json("Invalid Token");
    }

};