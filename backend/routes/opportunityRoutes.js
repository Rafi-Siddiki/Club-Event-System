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
    getInterestedPackages,
    createSponsorshipRequest,
    publishOpportunity,
    postponeOpportunity,
    getSponsorRecords
} = require('../controllers/opportunityController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/customMiddleware');

// Routes with specific paths must come BEFORE routes with path parameters
router.get('/attending', protect, getAttendingEvents);
router.get('/interested-packages', protect, getInterestedPackages);
// Route for sponsors to get their accepted/rejected records - moved here to fix routing issues
router.get('/my-records', protect, authorizeRoles('sponsor'), getSponsorRecords);

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

// Add this right before or after your other sponsorship routes
router.post('/:id/sponsorship', protect, createSponsorshipRequest);

// Add these routes
router.put('/:id/publish', protect, publishOpportunity);
router.put('/:id/postpone', protect, postponeOpportunity);

module.exports = router;