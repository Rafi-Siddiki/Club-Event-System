// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const {
    registerUser,
    registerSponsor,
    loginUser,
    getMe,
    getUserById,
    approveUser,
    rejectUser,
    getAllUsers,
    updateUser
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');
const { requireApproval, authorizeRoles } = require('../middleware/customMiddleware');

router.post('/reguser', registerUser);
router.post('/regsponsor', registerSponsor);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Update the route for getting all users
router.get('/', protect, authorizeRoles('panel', 'registrar'), getAllUsers);

// Get user by id - only accessible by registrar and admin
router.get('/:id', protect, authorizeRoles('registrar', 'admin'), getUserById);

// Approval - only panel/registrar can approve users
router.put('/approve/:id', protect, authorizeRoles('panel', 'registrar'), approveUser);

// Add this route
router.put('/reject/:id', protect, authorizeRoles('panel', 'registrar'), rejectUser);

// Update user profile - accessible by registrar or the user themselves
router.put('/:id', protect, updateUser);

module.exports = router;
