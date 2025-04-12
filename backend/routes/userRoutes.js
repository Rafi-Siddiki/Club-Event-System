// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const {
    registerUser,
    registerSponsor,
    loginUser,
    getMe,
    approveUser
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');
const { requireApproval, authorizeRoles } = require('../middleware/customMiddleware');

router.post('/reguser', registerUser);
router.post('/regsponsor', registerSponsor);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// New: Only panel/registrar can approve users
router.put('/approve/:id', protect, authorizeRoles('panel', 'registrar'), approveUser);

module.exports = router;
