const e = require("express");

module.exports = (req, res, next) => {
    const { email, name, password, employee_number } = req.body;

    function validEmail(userEmail) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail);
    }

    if (req.path === '/register') {
        // registration currently requires email, name, password
        if (![email, name, password].every(Boolean)) {
            return res.status(401).json({ error: "All fields are required" });
        } else if (!validEmail(email)) {
            return res.status(401).json({ error: "Invalid email format" });
        }
    } else if (req.path === '/login') {
        // allow login with either employee_number or email (plus password)
        if (!password || (!employee_number && !email)) {
            return res.status(401).json({ error: "All fields are required" });
        }

        if (email && !validEmail(email)) {
            return res.status(401).json({ error: "Invalid email format" });
        }
    }
    next();
}
