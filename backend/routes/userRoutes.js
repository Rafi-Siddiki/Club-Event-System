const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, registerSponsor } = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

router.post('/reguser', registerUser);
router.post('/regsponsor', registerSponsor);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Temporary route to get user IDs - remove after use
router.get('/get-ids', async (req, res) => {
    try {
        const User = require('../models/userModel');
        const users = await User.find().select('_id name email role').limit(5);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;