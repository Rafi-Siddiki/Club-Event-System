const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    message: {
        type: String,
        required: [true, 'Please provide a message'],
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Opportunity', // Reference the Opportunity model
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
