const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for the proposal']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description']
    },
    requestedAmount: {
        type: Number,
        required: [true, 'Please provide the requested amount']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sponsor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }
}, { timestamps: true });

module.exports = mongoose.model('Proposal', proposalSchema);