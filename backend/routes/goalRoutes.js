// backend/routes/goalRoutes.js

const express = require('express');
const router = express.Router();
const {
    getGoal,
    setGoal,
    putGoal,
    deleteGoal
} = require('../controllers/goalController');

const { protect } = require('../middleware/authMiddleware');
const { requireApproval } = require('../middleware/customMiddleware');

router.route('/')
    .get(protect, requireApproval, getGoal)
    .post(protect, requireApproval, setGoal);

router.route('/:id')
    .put(protect, requireApproval, putGoal)
    .delete(protect, requireApproval, deleteGoal);

module.exports = router;
