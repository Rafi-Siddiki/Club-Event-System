const express = require('express');
const router = express.Router();
const { 
    getOpportunities,
    getOpportunityById,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    expressInterest
} = require('../controllers/opportunityController');
const { protect } = require('../middleware/authMiddleware');

// Routes for opportunities
router.get('/', protect, getOpportunities);
router.get('/:id', protect, getOpportunityById);
router.post('/', protect, createOpportunity);
router.put('/:id', protect, updateOpportunity);
router.delete('/:id', protect, deleteOpportunity);
router.post('/:id/interest', protect, expressInterest);

module.exports = router;