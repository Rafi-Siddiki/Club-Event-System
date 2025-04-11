// backend/middleware/customMiddleware.js

const requireApproval = (req, res, next) => {
    if (!req.user.approved) {
        return res.status(403).json({ message: 'Account pending approval' });
    }
    next();
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: insufficient role' });
        }
        next();
    };
};

module.exports = {
    requireApproval,
    authorizeRoles,
};
