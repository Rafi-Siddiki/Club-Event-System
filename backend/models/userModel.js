const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6
    },
    club: {
        type: String,
    },
    role: {
        type: String,
    },
    company: {
        type: String,
    },
    cevent: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);