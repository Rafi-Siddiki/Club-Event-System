const asyncHandler = require('express-async-handler');
const Opportunity = require('../models/opportunityModel');
const User = require('../models/userModel');

// @desc    Get all opportunities
// @route   GET /api/opportunities
// @access  Private
const getOpportunities = asyncHandler(async (req, res) => {
    // Check if request is from a sponsor user
    if (req.user.role === 'sponsor') {
        // Only return opportunities with approved sponsorship requests
        const opportunities = await Opportunity.find({
            'sponsorshipRequestApproval.status': 'approved'
        });
        return res.status(200).json(opportunities);
    }
    
    // For other roles (admin, registrar, etc.), return all opportunities
    const opportunities = await Opportunity.find({});
    res.status(200).json(opportunities);
});

// @desc    Get opportunity by ID
// @route   GET /api/opportunities/:id
// @access  Private
const getOpportunityById = asyncHandler(async (req, res) => {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }
    
    res.status(200).json(opportunity);
});

// @desc    Create new opportunity
// @route   POST /api/opportunities
// @access  Private
const createOpportunity = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        date,
        club,
        attendance,
        startingPrice,
        location,
        packages,
        image,
        contactPerson,
        contactEmail
    } = req.body;

    if (!name || !description || !date || !club || !attendance || !startingPrice || !location || !packages || !contactPerson || !contactEmail) {
        res.status(400);
        throw new Error('Please fill all required fields');
    }

    const opportunity = await Opportunity.create({
        name,
        description,
        date,
        club,
        attendance,
        startingPrice,
        location,
        packages,
        image: image || '',
        contactPerson,
        contactEmail
    });

    res.status(201).json(opportunity);
});

// @desc    Update opportunity
// @route   PUT /api/opportunities/:id
// @access  Private
const updateOpportunity = asyncHandler(async (req, res) => {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }

    const updatedOpportunity = await Opportunity.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json(updatedOpportunity);
});

// @desc    Delete opportunity
// @route   DELETE /api/opportunities/:id
// @access  Private
const deleteOpportunity = asyncHandler(async (req, res) => {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }

    await opportunity.deleteOne();

    res.status(200).json({ id: req.params.id });
});

// @desc    Express interest in an opportunity
// @route   POST /api/opportunities/:id/interest
// @access  Private
const expressInterest = asyncHandler(async (req, res) => {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }

    // Check if user is already interested
    if (opportunity.interestedSponsors.includes(req.user.id)) {
        res.status(400);
        throw new Error('You have already expressed interest in this opportunity');
    }

    opportunity.interestedSponsors.push(req.user.id);
    await opportunity.save();

    res.status(200).json(opportunity);
});

// @desc    Approve sponsor interest for an opportunity
// @route   PUT /api/opportunities/:id/interest/:sponsorId/approve
// @access  Private (Registrar only)
const approveInterest = asyncHandler(async (req, res) => {
    // Check if user is a registrar
    if (req.user.role !== 'registrar') {
        res.status(403);
        throw new Error('Unauthorized. Only registrars can approve interest requests');
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }

    const sponsorId = req.params.sponsorId;
    
    // Check if sponsor has expressed interest
    if (!opportunity.interestedSponsors.includes(sponsorId)) {
        res.status(404);
        throw new Error('This sponsor has not expressed interest in this opportunity');
    }

    // Update the opportunity with approval details
    opportunity.sponsorshipRequestApproval = {
        status: 'approved',
        updatedBy: req.user.id,
        updatedAt: Date.now(),
        comments: req.body.comments || 'Interest request approved'
    };

    await opportunity.save();

    res.status(200).json({
        message: 'Sponsor interest has been approved',
        opportunity
    });
});

// @desc    Reject sponsor interest for an opportunity
// @route   PUT /api/opportunities/:id/interest/:sponsorId/reject
// @access  Private (Registrar only)
const rejectInterest = asyncHandler(async (req, res) => {
    // Check if user is a registrar
    if (req.user.role !== 'registrar') {
        res.status(403);
        throw new Error('Unauthorized. Only registrars can reject interest requests');
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }

    const sponsorId = req.params.sponsorId;
    
    // Check if sponsor has expressed interest
    if (!opportunity.interestedSponsors.includes(sponsorId)) {
        res.status(404);
        throw new Error('This sponsor has not expressed interest in this opportunity');
    }

    // Update the opportunity with rejection details
    opportunity.sponsorshipRequestApproval = {
        status: 'rejected',
        updatedBy: req.user.id,
        updatedAt: Date.now(),
        comments: req.body.comments || 'Interest request rejected'
    };

    // Remove sponsor from interested sponsors list
    opportunity.interestedSponsors = opportunity.interestedSponsors.filter(
        id => id.toString() !== sponsorId
    );

    await opportunity.save();

    res.status(200).json({
        message: 'Sponsor interest has been rejected',
        opportunity
    });
});

module.exports = {
    getOpportunities,
    getOpportunityById,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    expressInterest,
    approveInterest,
    rejectInterest
};