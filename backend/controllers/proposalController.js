const asyncHandler = require('express-async-handler');
const Proposal = require('../models/proposalModel');
const User = require('../models/userModel');

// @desc    Get proposals for a sponsor
// @route   GET /api/proposals
// @access  Private (Sponsor only)
const getProposals = asyncHandler(async (req, res) => {
    // Check if user is a sponsor
    if (req.user.role !== 'sponsor') {
        res.status(403);
        throw new Error('Not authorized, sponsor access only');
    }

    // Get all proposals related to the sponsor's event
    // This assumes sponsors are associated with events through their 'cevent' field
    const proposals = await Proposal.find({
        eventId: req.user.cevent
    })
    .populate('applicant', 'name email')
    .sort({ createdAt: -1 });

    res.status(200).json(proposals);
});

// @desc    Create a new proposal
// @route   POST /api/proposals
// @access  Private
const createProposal = asyncHandler(async (req, res) => {
    const { title, description, requestedAmount, eventId } = req.body;

    if (!title || !description || !requestedAmount) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    const proposal = await Proposal.create({
        title,
        description,
        requestedAmount,
        status: 'pending',
        applicant: req.user.id,
        eventId
    });

    if (proposal) {
        res.status(201).json(proposal);
    } else {
        res.status(400);
        throw new Error('Invalid proposal data');
    }
});

// @desc    Update proposal status
// @route   PUT /api/proposals/:id
// @access  Private (Sponsor only)
const updateProposal = asyncHandler(async (req, res) => {
    const { status } = req.body;
    
    // Check if user is a sponsor
    if (req.user.role !== 'sponsor') {
        res.status(403);
        throw new Error('Not authorized, sponsor access only');
    }

    // Find the proposal
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
        res.status(404);
        throw new Error('Proposal not found');
    }

    // Update proposal status and sponsor
    const updatedProposal = await Proposal.findByIdAndUpdate(
        req.params.id,
        { 
            status,
            sponsor: req.user.id 
        },
        { new: true }
    ).populate('applicant', 'name email');

    res.status(200).json(updatedProposal);
});

// @desc    Get proposal by ID
// @route   GET /api/proposals/:id
// @access  Private
const getProposalById = asyncHandler(async (req, res) => {
    const proposal = await Proposal.findById(req.params.id)
        .populate('applicant', 'name email')
        .populate('sponsor', 'name company');

    if (!proposal) {
        res.status(404);
        throw new Error('Proposal not found');
    }

    // Check if user is authorized to view this proposal
    if (
        req.user.role !== 'sponsor' && 
        proposal.applicant.toString() !== req.user.id &&
        req.user.role !== 'panel'
    ) {
        res.status(403);
        throw new Error('Not authorized to view this proposal');
    }

    res.status(200).json(proposal);
});

module.exports = {
    getProposals,
    updateProposal,
    getProposalById,
    createProposal
};