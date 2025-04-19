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
    rejectInterest,
    approveOpportunity,
    rejectOpportunity,
    attendEvent,
    cancelAttendance,
    getAttendingEvents,
    approveSponsorshipRequest,
    rejectSponsorshipRequest,
    getInterestedPackages
} = require('../controllers/opportunityController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/customMiddleware');

// Add this route before your other opportunity routes
router.get('/attending', protect, getAttendingEvents);
router.get('/interested-packages', protect, getInterestedPackages);

// Routes for opportunities
router.get('/', protect, getOpportunities);
router.get('/:id', protect, getOpportunityById);
router.post('/', protect, createOpportunity);
router.put('/:id', protect, updateOpportunity);
router.delete('/:id', protect, deleteOpportunity);
router.post('/:id/interest', protect, expressInterest);

// New routes for general approval
router.put('/:id/approve', protect, authorizeRoles('registrar'), approveOpportunity);
router.put('/:id/reject', protect, authorizeRoles('registrar'), rejectOpportunity);

// New routes for user attendance
router.post('/:id/attend', protect, attendEvent);
router.delete('/:id/attend', protect, cancelAttendance);

// Routes for approving/rejecting interest
router.put('/:id/interest/:sponsorId/approve', protect, authorizeRoles('registrar'), approveInterest);
router.put('/:id/interest/:sponsorId/reject', protect, authorizeRoles('registrar'), rejectInterest);

// Routes for sponsorship request approval
router.put('/:id/sponsorship/approve', protect, authorizeRoles('registrar'), approveSponsorshipRequest);
router.put('/:id/sponsorship/reject', protect, authorizeRoles('registrar'), rejectSponsorshipRequest);

module.exports = router;