const mongoose = require('mongoose');

const opportunitySchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide an opportunity name']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description']
    },
    date: {
        type: Date,
        required: [true, 'Please provide an event date']
    },
    club: {
        type: String,
        required: [true, 'Please provide the organizing club name']
    },
    attendance: {
        type: String,
        required: [true, 'Please provide expected attendance']
    },
    startingPrice: {
        type: Number,
        required: [true, 'Please provide starting package price']
    },
    location: {
        type: String,
        required: [true, 'Please provide event location']
    },
    packages: [{
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        benefits: {
            type: [String],
            required: true
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
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Opportunity', opportunitySchema);