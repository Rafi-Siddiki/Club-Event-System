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

    // Check if packages is undefined or null, but allow empty array
    if (!name || !description || !date || !club || !attendance || 
        startingPrice === undefined || !location || packages === undefined || 
        !contactPerson || !contactEmail) {
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

    // Check if packageIndex is provided
    const { packageIndex } = req.body;
    
    // If packageIndex is provided, validate it
    if (packageIndex !== undefined) {
        if (!opportunity.packages || packageIndex >= opportunity.packages.length) {
            res.status(400);
            throw new Error('Invalid package selected');
        }
        
        // Store the package interest in a new array
        if (!opportunity.interestedPackages) {
            opportunity.interestedPackages = [];
        }
        
        // Check if already interested in this specific package
        const alreadyInterested = opportunity.interestedPackages.some(
            item => item.sponsorId.toString() === req.user.id && 
                   item.packageIndex === packageIndex
        );
        
        if (alreadyInterested) {
            res.status(400);
            throw new Error('You have already expressed interest in this package');
        }
        
        // Add package interest
        opportunity.interestedPackages.push({
            sponsorId: req.user.id,
            packageIndex,
            expressedAt: Date.now()
        });
    } else {
        // For backward compatibility - interest in the whole opportunity
        // Check if user is already interested
        if (opportunity.interestedSponsors.includes(req.user.id)) {
            res.status(400);
            throw new Error('You have already expressed interest in this opportunity');
        }
        
        opportunity.interestedSponsors.push(req.user.id);
    }

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

// @desc    Approve opportunity for general display
// @route   PUT /api/opportunities/:id/approve
// @access  Private (Registrar only)
const approveOpportunity = asyncHandler(async (req, res) => {
    // Check if user is a registrar
    if (req.user.role !== 'registrar') {
        res.status(403);
        throw new Error('Unauthorized. Only registrars can approve opportunities');
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }

    // Update the opportunity with approval details
    opportunity.generalApproval = {
        status: 'approved',
        updatedBy: req.user.id,
        updatedAt: Date.now(),
        comments: req.body.comments || 'Event approved'
    };

    await opportunity.save();

    res.status(200).json({
        message: 'Event has been approved',
        opportunity
    });
});

// @desc    Reject opportunity for general display
// @route   PUT /api/opportunities/:id/reject
// @access  Private (Registrar only)
const rejectOpportunity = asyncHandler(async (req, res) => {
    // Check if user is a registrar
    if (req.user.role !== 'registrar') {
        res.status(403);
        throw new Error('Unauthorized. Only registrars can reject opportunities');
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }

    // Update the opportunity with rejection details
    opportunity.generalApproval = {
        status: 'rejected',
        updatedBy: req.user.id,
        updatedAt: Date.now(),
        comments: req.body.comments || 'Event rejected'
    };

    await opportunity.save();

    res.status(200).json({
        message: 'Event has been rejected',
        opportunity
    });
});

// @desc    Approve sponsorship request
// @route   PUT /api/opportunities/:id/sponsorship/approve
// @access  Private (Registrar only)
const approveSponsorshipRequest = asyncHandler(async (req, res) => {
    // Check if user is a registrar
    if (req.user.role !== 'registrar') {
        res.status(403);
        throw new Error('Unauthorized. Only registrars can approve sponsorship requests');
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }

    // Update the opportunity with approval details
    opportunity.sponsorshipRequestApproval = {
        status: 'approved',
        updatedBy: req.user.id,
        updatedAt: Date.now(),
        comments: req.body.comments || 'Sponsorship request approved'
    };

    await opportunity.save();

    res.status(200).json({
        message: 'Sponsorship request has been approved',
        opportunity
    });
});

// @desc    Reject sponsorship request
// @route   PUT /api/opportunities/:id/sponsorship/reject
// @access  Private (Registrar only)
const rejectSponsorshipRequest = asyncHandler(async (req, res) => {
    // Check if user is a registrar
    if (req.user.role !== 'registrar') {
        res.status(403);
        throw new Error('Unauthorized. Only registrars can reject sponsorship requests');
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }

    // Update the opportunity with rejection details
    opportunity.sponsorshipRequestApproval = {
        status: 'rejected',
        updatedBy: req.user.id,
        updatedAt: Date.now(),
        comments: req.body.comments || 'Sponsorship request rejected'
    };

    await opportunity.save();

    res.status(200).json({
        message: 'Sponsorship request has been rejected',
        opportunity
    });
});

// @desc    Mark user as attending an event
// @route   POST /api/opportunities/:id/attend
// @access  Private
const attendEvent = asyncHandler(async (req, res) => {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
        res.status(404);
        throw new Error('Event not found');
    }

    // Check if event is approved
    if (opportunity.generalApproval.status !== 'approved') {
        res.status(400);
        throw new Error('This event is not currently approved for attendance');
    }

    // Check if user is already attending
    if (opportunity.attendingUsers.includes(req.user.id)) {
        res.status(400);
        throw new Error('You are already attending this event');
    }

    opportunity.attendingUsers.push(req.user.id);
    await opportunity.save();

    res.status(200).json(opportunity);
});

// @desc    Remove user from attending an event
// @route   DELETE /api/opportunities/:id/attend
// @access  Private
const cancelAttendance = asyncHandler(async (req, res) => {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
        res.status(404);
        throw new Error('Event not found');
    }

    // Check if user is actually attending
    if (!opportunity.attendingUsers.includes(req.user.id)) {
        res.status(400);
        throw new Error('You are not attending this event');
    }

    // Remove user from attending users list
    opportunity.attendingUsers = opportunity.attendingUsers.filter(
        id => id.toString() !== req.user.id.toString()
    );

    await opportunity.save();

    res.status(200).json({
        message: 'You have cancelled your attendance',
        opportunity
    });
});

// @desc    Get events user is attending
// @route   GET /api/opportunities/attending
// @access  Private
const getAttendingEvents = asyncHandler(async (req, res) => {
    const attendingEvents = await Opportunity.find({
        attendingUsers: req.user.id,
        'generalApproval.status': 'approved'
    });

    res.status(200).json(attendingEvents);
});

// @desc    Get opportunities/packages that the user is interested in
// @route   GET /api/opportunities/interested-packages
// @access  Private
const getInterestedPackages = asyncHandler(async (req, res) => {
    const opportunities = await Opportunity.find({
        'interestedPackages.sponsorId': req.user.id
    });
    
    const interestedPackages = [];
    
    opportunities.forEach(opportunity => {
        const userInterests = opportunity.interestedPackages.filter(
            item => item.sponsorId.toString() === req.user.id
        );
        
        userInterests.forEach(interest => {
            interestedPackages.push({
                opportunityId: opportunity._id,
                packageIndex: interest.packageIndex,
                expressedAt: interest.expressedAt
            });
        });
    });
    
    res.status(200).json(interestedPackages);
});

module.exports = {
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
};