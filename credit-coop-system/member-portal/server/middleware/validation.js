module.exports = (req, res, next) => {
    const { name, email, memberNumber, password } = req.body;

    function validEmail(userEmail){
        return /^\S+@\S+\.\S+$/.test(userEmail);
    }

    if (req.path === "/register") {
        if (![email, name, password].every(Boolean)) {
            return res.status(401).json("Missing Credentials");
        } else if (!validEmail(email)) {
        return res.status(401).json("Invalid Email");
        }
    } else if (req.path === "/login") {
        // Accept either email or memberNumber for login
        const loginField = email || memberNumber;
        if (![loginField, password].every(Boolean)) {
            return res.status(401).json("Missing Credentials");
        }
        // Only validate email format if email is provided
        if (email && !validEmail(email)) {
            return res.status(401).json("Invalid Email");
        }
    }

  next();

};