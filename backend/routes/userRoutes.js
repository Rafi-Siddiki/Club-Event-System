const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, registerSponsor } = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

router.post('/reguser', registerUser);
router.post('/regsponsor', registerSponsor);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;