const e = require("express");

module.exports = (req, res, next) => {
    // Accept either snake_case or camelCase employee number from different clients
    const { email, name, password, employee_number, employeeNumber } = req.body;
    const empNum = employee_number || employeeNumber;

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
        // allow login with either employee_number (snake_case or camelCase) or email (plus password)
        if (!password || (!empNum && !email)) {
            return res.status(401).json({ error: "All fields are required" });
        }

        if (email && !validEmail(email)) {
            return res.status(401).json({ error: "Invalid email format" });
        }
    }
    next();
}
