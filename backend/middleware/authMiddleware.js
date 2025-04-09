const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check if the Authorization header is present and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract token from the header
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using the JWT_SECRET
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach the user from the decoded token to the request
            req.user = await User.findById(decoded.id).select('-password');

            // Proceed to the next middleware or route handler
            return next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }

    // If no token is found in the Authorization header
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
});

module.exports = { protect };
