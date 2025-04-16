const express = require('express');
const router = express.Router();
const { 
    getOpportunities,
    getOpportunityById,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    expressInterest,
    approveInterest,
    rejectInterest
} = require('../controllers/opportunityController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/customMiddleware');

// Routes for opportunities
router.get('/', protect, getOpportunities);
router.get('/:id', protect, getOpportunityById);
router.post('/', protect, createOpportunity);
router.put('/:id', protect, updateOpportunity);
router.delete('/:id', protect, deleteOpportunity);
router.post('/:id/interest', protect, expressInterest);

// New routes for approving/rejecting interest
router.put('/:id/interest/:sponsorId/approve', protect, authorizeRoles('registrar'), approveInterest);
router.put('/:id/interest/:sponsorId/reject', protect, authorizeRoles('registrar'), rejectInterest);

module.exports = router;