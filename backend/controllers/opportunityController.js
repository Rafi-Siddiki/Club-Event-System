const asyncHandler = require('express-async-handler');
const Opportunity = require('../models/opportunityModel');
const User = require('../models/userModel');

// @desc    Get all opportunities
// @route   GET /api/opportunities
// @access  Private
const getOpportunities = asyncHandler(async (req, res) => {
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

module.exports = {
    getOpportunities,
    getOpportunityById,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    expressInterest
};