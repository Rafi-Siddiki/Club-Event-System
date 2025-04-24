const mongoose = require('mongoose');

const opportunitySchema = mongoose.Schema({
    name: {
        type: String,
        required: ['Please provide an opportunity name']
    },
    description: {
        type: String,
        required: ['Please provide a description']
    },
    date: {
        type: Date,
        required: ['Please provide an event date']
    },
    club: {
        type: String,
        required: ['Please provide the organizing club name']
    },
    attendance: {
        type: String,
        required: ['Please provide expected attendance']
    },
    startingPrice: {
        type: Number,
        required: ['Please provide starting package price']
    },
    location: {
        type: String,
        required: ['Please provide event location']
    },
    packages: [{
        name: {
            type: String,
        },
        price: {
            type: Number,
        },
        benefits: {
            type: [String],
        },
        registrarFunds: {
            type: Number,
            default: 0
        }
    }],
    image: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed'],
        default: 'upcoming'
    },
    contactPerson: {
        type: String,
        required: [true, 'Please provide a contact person']
    },
    contactEmail: {
        type: String,
        required: [true, 'Please provide a contact email']
    },
    interestedSponsors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    attendingUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Sponsor-related approval
    sponsorshipRequestApproval: {
        status: {
            type: String,
            enum: ['none', 'pending', 'approved', 'rejected'],
            default: 'none' // Changed from 'pending' to 'none'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedAt: {
            type: Date
        },
        comments: {
            type: String
        },
        registrarFunds: {
            type: Number,
            default: 0
        }
    },
    // General event approval
    generalApproval: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedAt: {
            type: Date
        },
        comments: {
            type: String
        }
    },
    sponsorshipContributionApproval: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'declined'],
            default: 'pending'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedAt: {
            type: Date
        },
        comments: {
            type: String
        },
        approvedSponsorId: { // Track which sponsor was approved for general interest
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    interestedPackages: [{
        sponsorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        packageIndex: {
            type: Number,
            required: true
        },
        expressedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Track which sponsors have been approved for specific packages
    approvedPackageSponsors: [{
        packageIndex: {
            type: Number,
            required: true
        },
        sponsorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        approvedAt: {
            type: Date,
            default: Date.now
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    // Track notifications for rejected sponsors
    rejectedSponsorsNotifications: [{
        sponsorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        packageIndex: {
            type: Number,
            required: true
        },
        reason: {
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        read: {
            type: Boolean,
            default: false
        }
    }],
    // Publication status
    publicationStatus: {
        status: {
            type: String,
            enum: ['unpublished', 'published', 'postponed'],
            default: 'unpublished'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedAt: {
            type: Date
        },
        comments: {
            type: String
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Opportunity', opportunitySchema);