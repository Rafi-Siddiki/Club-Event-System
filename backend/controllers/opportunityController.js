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

    // Determine if this is a sponsorship request or just an event
    const isSponsorshipRequest = packages && packages.length > 0 && startingPrice > 0;

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
        contactEmail,
        // Set sponsorshipRequestApproval status based on whether packages exist
        sponsorshipRequestApproval: isSponsorshipRequest ? 
            { status: 'pending', updatedBy: req.user.id, updatedAt: Date.now() } : 
            { status: 'none' }
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
    
    // Check if sponsor has expressed general interest
    const hasGeneralInterest = opportunity.interestedSponsors && opportunity.interestedSponsors.includes(sponsorId);
    
    // Check if sponsor has expressed package-specific interest
    const packageInterests = opportunity.interestedPackages && 
                              opportunity.interestedPackages.filter(pkg => pkg.sponsorId.toString() === sponsorId);
    const hasPackageInterest = packageInterests && packageInterests.length > 0;
    
    // If no interest found in either array, return error
    if (!hasGeneralInterest && !hasPackageInterest) {
        res.status(404);
        throw new Error('This sponsor has not expressed interest in this opportunity');
    }

    // Update the approval status for this specific sponsor
    if (hasGeneralInterest) {
        // For general interest, update the sponsorshipContributionApproval field
        opportunity.sponsorshipContributionApproval = {
            status: 'approved',
            updatedBy: req.user.id,
            updatedAt: Date.now(),
            comments: req.body.comments || 'Sponsor contribution approved',
            approvedSponsorId: sponsorId // Track which sponsor was approved
        };
        
        // Remove sponsor from interested sponsors list
        opportunity.interestedSponsors = opportunity.interestedSponsors.filter(
            id => id.toString() !== sponsorId
        );

        // When a general request is approved, we need to:
        // 1. Find all other sponsors who have expressed interest in this proposal (either general or package-specific)
        const otherGeneralSponsors = opportunity.interestedSponsors || [];
        const otherPackageSponsors = opportunity.interestedPackages 
                                    ? [...new Set(opportunity.interestedPackages.map(pkg => pkg.sponsorId.toString()))]
                                    : [];
        
        // Get unique list of all other interested sponsors
        const allOtherSponsors = [...new Set([...otherGeneralSponsors.map(id => id.toString()), ...otherPackageSponsors])];
        
        console.log(`Found ${allOtherSponsors.length} other sponsors with interest in this proposal`);
        
        // 2. If rejected sponsors notifications tracking doesn't exist, create it
        if (!opportunity.rejectedSponsorsNotifications) {
            opportunity.rejectedSponsorsNotifications = [];
        }
        
        // 3. Create rejection notifications for all other sponsors
        allOtherSponsors.forEach(rejectedId => {
            if (rejectedId !== sponsorId) { // Avoid creating rejection for the approved sponsor
                opportunity.rejectedSponsorsNotifications.push({
                    sponsorId: rejectedId,
                    packageIndex: -1, // Use -1 to indicate general proposal rejection
                    reason: 'Another sponsor was selected for this entire proposal',
                    createdAt: Date.now(),
                    read: false
                });
            }
        });
        
        // 4. Clear all interest in this opportunity (both general and package-specific)
        opportunity.interestedSponsors = []; // Clear all general interest
        opportunity.interestedPackages = []; // Clear all package interest
        
        // 5. Mark all packages as taken by creating approved package entries for this sponsor
        if (opportunity.packages && opportunity.packages.length > 0) {
            // If approved package sponsors tracking doesn't exist, create it
            if (!opportunity.approvedPackageSponsors) {
                opportunity.approvedPackageSponsors = [];
            }
            
            // Add entries for each package showing this sponsor was approved for all
            for (let i = 0; i < opportunity.packages.length; i++) {
                opportunity.approvedPackageSponsors.push({
                    packageIndex: i,
                    sponsorId,
                    approvedAt: Date.now(),
                    approvedBy: req.user.id
                });
            }
        }
        
    } else if (hasPackageInterest) {
        // For package-specific interest, we need to:
        // 1. Get the package index that this sponsor was interested in
        const approvedPackageInterest = packageInterests[0]; // Get the first one if multiple
        const packageIndex = approvedPackageInterest.packageIndex;
        
        // 2. Find all other sponsors interested in the same package
        const otherSponsorsForSamePackage = opportunity.interestedPackages.filter(
            pkg => pkg.packageIndex === packageIndex && pkg.sponsorId.toString() !== sponsorId
        );
        
        // 3. Store the list of rejected sponsor IDs for notification (not implemented here)
        const rejectedSponsorIds = otherSponsorsForSamePackage.map(pkg => pkg.sponsorId);
        
        // 4. If package approved sponsors tracking doesn't exist, create it
        if (!opportunity.approvedPackageSponsors) {
            opportunity.approvedPackageSponsors = [];
        }
        
        // 5. Record which sponsor was approved for this specific package
        opportunity.approvedPackageSponsors.push({
            packageIndex,
            sponsorId,
            approvedAt: Date.now(),
            approvedBy: req.user.id
        });
        
        // 6. Remove all interests for this specific package (including the approved one)
        opportunity.interestedPackages = opportunity.interestedPackages.filter(
            pkg => pkg.packageIndex !== packageIndex
        );
        
        // 7. Log (for debugging) - can be removed in production
        console.log(`Approved sponsor ${sponsorId} for package ${packageIndex}`);
        console.log(`Automatically rejected sponsors: ${rejectedSponsorIds.join(', ')}`);
        
        // 8. Add notification entries for rejected sponsors
        if (!opportunity.rejectedSponsorsNotifications) {
            opportunity.rejectedSponsorsNotifications = [];
        }
        
        rejectedSponsorIds.forEach(rejectedId => {
            opportunity.rejectedSponsorsNotifications.push({
                sponsorId: rejectedId,
                packageIndex,
                reason: 'Another sponsor was selected for this package',
                createdAt: Date.now(),
                read: false
            });
        });

        // 9. NEW FEATURE: Reject all general interest requests for this proposal
        if (opportunity.interestedSponsors && opportunity.interestedSponsors.length > 0) {
            console.log(`Found ${opportunity.interestedSponsors.length} general interest requests to reject`);
            
            // Add rejection notifications for all sponsors with general interest
            opportunity.interestedSponsors.forEach(generalInterestSponsorId => {
                opportunity.rejectedSponsorsNotifications.push({
                    sponsorId: generalInterestSponsorId,
                    packageIndex: -1, // -1 indicates general proposal rejection
                    reason: 'A package in this proposal has been assigned to a sponsor',
                    rejectedAt: Date.now(),
                    rejectedBy: req.user.id,
                    read: false
                });
            });
            
            // Clear all general interest requests
            opportunity.interestedSponsors = [];
        }
    }

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
    
    // Check if sponsor has expressed general interest
    const hasGeneralInterest = opportunity.interestedSponsors && opportunity.interestedSponsors.includes(sponsorId);
    
    // Check if sponsor has expressed package-specific interest
    const packageInterests = opportunity.interestedPackages && 
                              opportunity.interestedPackages.filter(pkg => pkg.sponsorId.toString() === sponsorId);
    const hasPackageInterest = packageInterests && packageInterests.length > 0;
    
    // If no interest found in either array, return error
    if (!hasGeneralInterest && !hasPackageInterest) {
        res.status(404);
        throw new Error('This sponsor has not expressed interest in this opportunity');
    }

    // Update the approval status for this specific sponsor
    if (hasGeneralInterest) {
        // For general interest, update the sponsorshipContributionApproval field
        // and remove from interestedSponsors array
        opportunity.sponsorshipContributionApproval = {
            status: 'declined',
            updatedBy: req.user.id,
            updatedAt: Date.now(),
            comments: req.body.comments || 'Sponsor contribution declined',
            rejectedSponsorId: sponsorId // Track which sponsor was rejected
        };
        
        // Remove sponsor from interested sponsors list
        opportunity.interestedSponsors = opportunity.interestedSponsors.filter(
            id => id.toString() !== sponsorId
        );
        
        // ADDED: Also add to rejectedSponsorsNotifications to ensure backward compatibility
        // and to make sure the rejection shows up properly in the frontend
        if (!opportunity.rejectedSponsorsNotifications) {
            opportunity.rejectedSponsorsNotifications = [];
        }
        
        // Add to rejection notifications with packageIndex = -1
        opportunity.rejectedSponsorsNotifications.push({
            sponsorId,
            packageIndex: -1, // -1 indicates general proposal rejection
            reason: 'Interest request rejected by registrar',
            rejectedAt: Date.now(),
            rejectedBy: req.user.id,
            read: false
        });
    } else if (hasPackageInterest) {
        // For package-specific interest, we need to:
        // 1. Get the package indices that this sponsor was interested in
        const packageIndices = packageInterests.map(pkg => pkg.packageIndex);
        
        // 2. If rejected sponsors notifications tracking doesn't exist, create it
        if (!opportunity.rejectedSponsorsNotifications) {
            opportunity.rejectedSponsorsNotifications = [];
        }
        
        // 3. Record which sponsor was rejected for each specific package
        packageIndices.forEach(packageIndex => {
            opportunity.rejectedSponsorsNotifications.push({
                packageIndex,
                sponsorId,
                rejectedAt: Date.now(),
                rejectedBy: req.user.id,
                reason: 'Interest request rejected by registrar',
                read: false
            });
        });
        
        // 4. Remove the sponsor's interest from interested packages array
        opportunity.interestedPackages = opportunity.interestedPackages.filter(
            pkg => pkg.sponsorId.toString() !== sponsorId
        );
        
        // 5. Log (for debugging) - can be removed in production
        console.log(`Rejected sponsor ${sponsorId} for packages: ${packageIndices.join(', ')}`);
    }

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

    // Get the package fund allocations from the request body
    const { allocations } = req.body;

    // If allocations for packages are provided, validate and update them
    if (allocations && Array.isArray(allocations)) {
        // Validate each allocation
        for (let i = 0; i < allocations.length; i++) {
            const { packageIndex, amount } = allocations[i];
            
            // Check if package index is valid
            if (packageIndex < 0 || packageIndex >= opportunity.packages.length) {
                res.status(400);
                throw new Error(`Invalid package index: ${packageIndex}`);
            }
            
            // Check if allocated amount is valid
            if (amount < 0) {
                res.status(400);
                throw new Error('Allocated funds cannot be negative');
            }
            
            const packagePrice = opportunity.packages[packageIndex].price;
            if (amount > packagePrice) {
                res.status(400);
                throw new Error(`Allocated funds cannot exceed package price of $${packagePrice}`);
            }
            
            // Update the package's registrarFunds
            opportunity.packages[packageIndex].registrarFunds = amount;
        }
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
        message: 'Sponsorship request has been approved with allocated funds',
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

// @desc    Create sponsorship request for an opportunity
// @route   POST /api/opportunities/:id/sponsorship
// @access  Private
const createSponsorshipRequest = asyncHandler(async (req, res) => {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }

    // Update opportunity with sponsorship details
    opportunity.startingPrice = req.body.startingPrice;
    opportunity.packages = req.body.packages;
    
    // Set the sponsorship request approval to pending
    opportunity.sponsorshipRequestApproval = {
        status: 'pending',
        updatedBy: req.user.id,
        updatedAt: Date.now()
    };

    await opportunity.save();

    res.status(200).json(opportunity);
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

// @desc    Publish opportunity to users
// @route   PUT /api/opportunities/:id/publish
// @access  Private (Panel only)
const publishOpportunity = asyncHandler(async (req, res) => {
    // Check if user is a panel member
    if (req.user.role !== 'panel') {
        res.status(403);
        throw new Error('Unauthorized. Only panel members can publish opportunities');
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }

    // Check if opportunity is approved
    if (!opportunity.generalApproval || opportunity.generalApproval.status !== 'approved') {
        res.status(400);
        throw new Error('This opportunity must be approved by a registrar before publishing');
    }

    // Update the opportunity with publication details
    opportunity.publicationStatus = {
        status: 'published',
        updatedBy: req.user.id,
        updatedAt: Date.now(),
        comments: req.body.comments || 'Event published to users'
    };

    await opportunity.save();

    res.status(200).json({
        message: 'Event has been published and is now visible to users',
        opportunity
    });
});

// @desc    Postpone opportunity 
// @route   PUT /api/opportunities/:id/postpone
// @access  Private (Panel only)
const postponeOpportunity = asyncHandler(async (req, res) => {
    // Check if user is a panel member
    if (req.user.role !== 'panel') {
        res.status(403);
        throw new Error('Unauthorized. Only panel members can postpone opportunities');
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
        res.status(404);
        throw new Error('Opportunity not found');
    }

    // Update the opportunity with postponement details
    opportunity.publicationStatus = {
        status: 'postponed',
        updatedBy: req.user.id,
        updatedAt: Date.now(),
        comments: req.body.comments || 'Event postponed'
    };

    await opportunity.save();

    res.status(200).json({
        message: 'Event has been postponed',
        opportunity
    });
});

// @desc    Get accepted and rejected sponsorship records for the logged-in sponsor
// @route   GET /api/opportunities/my-records
// @access  Private (Sponsor only)
const getSponsorRecords = asyncHandler(async (req, res) => {
    const sponsorId = req.user.id;

    // Find opportunities where the sponsor was approved (either for a package or the whole proposal)
    const acceptedOpportunities = await Opportunity.find({
        $or: [
            { 'approvedPackageSponsors.sponsorId': sponsorId },
            { 'sponsorshipContributionApproval.approvedSponsorId': sponsorId }
        ]
    }).select('name date status packages approvedPackageSponsors sponsorshipContributionApproval'); // Select relevant fields

    // Find opportunities where the sponsor was rejected (either for a package or the whole proposal)
    // Include 'packages' in the selection to ensure we have package data for rejected packages
    const rejectedOpportunities = await Opportunity.find({
        'rejectedSponsorsNotifications.sponsorId': sponsorId
    }).select('name date status packages rejectedSponsorsNotifications'); // Added 'packages' to the selection

    // Process accepted records to include package details if applicable
    const acceptedRecords = acceptedOpportunities.map(opp => {
        let acceptedDetail = 'General Proposal';
        if (opp.approvedPackageSponsors && opp.approvedPackageSponsors.length > 0) {
            const sponsorPackages = opp.approvedPackageSponsors
                .filter(pkg => pkg.sponsorId.toString() === sponsorId)
                .map(pkg => {
                    // Check if packages and the specific package index exist
                    if (opp.packages && opp.packages[pkg.packageIndex]) {
                        return opp.packages[pkg.packageIndex].name || `Package ${pkg.packageIndex + 1}`;
                    }
                    return `Package ${pkg.packageIndex + 1}`;
                });
            if (sponsorPackages.length > 0) {
                acceptedDetail = `Package(s): ${sponsorPackages.join(', ')}`;
            }
        }
        return {
            _id: opp._id,
            name: opp.name,
            date: opp.date,
            status: 'Accepted',
            detail: acceptedDetail
        };
    });

    // Process rejected records to include package details and reason if applicable
    const rejectedRecords = rejectedOpportunities.map(opp => {
        const rejectionDetails = opp.rejectedSponsorsNotifications
            .filter(notif => notif.sponsorId.toString() === sponsorId)
            .map(notif => {
                let packageName = 'General Proposal';
                
                // Only try to access package name if it's not a general proposal rejection
                if (notif.packageIndex !== -1) {
                    // Safely check if packages and the specific index exist
                    if (opp.packages && opp.packages[notif.packageIndex]) {
                        packageName = opp.packages[notif.packageIndex].name || `Package ${notif.packageIndex + 1}`;
                    } else {
                        packageName = `Package ${notif.packageIndex + 1}`;
                    }
                }
                
                return `${packageName} (Reason: ${notif.reason || 'Not specified'})`;
            });
        
        return {
            _id: opp._id,
            name: opp.name,
            date: opp.date,
            status: 'Rejected',
            detail: rejectionDetails.join('; ') || 'Reason not specified'
        };
    });

    res.status(200).json({ 
        accepted: acceptedRecords,
        rejected: rejectedRecords
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
    rejectInterest,
    approveOpportunity,
    rejectOpportunity,
    attendEvent,
    cancelAttendance,
    getAttendingEvents,
    approveSponsorshipRequest,
    rejectSponsorshipRequest,
    createSponsorshipRequest,
    getInterestedPackages,
    publishOpportunity,
    postponeOpportunity,
    getSponsorRecords
};