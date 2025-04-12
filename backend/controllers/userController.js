const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

//@desc Register a new user
//@route POST /api/users/reguser
//@access Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, phone, club, role } = req.body; // Extract all fields

    if (!name || !email || !password || !phone) { 
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Hash password 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        club,
        approved: false,
        role: role || 'user', // Default role to 'user' if not provided // role,
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            club: user.club,
            role: user.role,
            approved: user.approved,
            token: generateToken(user._id), // Generate JWT token
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

//@desc Register a sponsor
//@route POST /api/users/regsponsor
//@access Public
const registerSponsor = asyncHandler(async (req, res) => {
    const { name, email, password, phone, role, company, cevent } = req.body; // Extract all fields

    if (!name || !email || !password || !phone) { 
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Hash password 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        role: role || 'sponsor', // Default role to 'sponsor' if not provided // role,
        company,
        approved: false,
        cevent
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            company: user.company,
            cevent: user.cevent,
            approved: user.approved,
            token: generateToken(user._id), // Generate JWT token
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

//@desc Authenticate a user
//@route POST /api/users/login
//@access Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        // Check if the user is approved
        if (!user.approved) {
            res.status(403); // Forbidden
            throw new Error('Your account is pending approval. Please wait for an administrator to approve your account.');
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            club: user.club,
            role: user.role,
            company: user.company,
            cevent: user.cevent,
            approved: user.approved,
            msg: 'login success',
            token: generateToken(user._id), // Generate JWT token
        });
    } else {
        res.status(400);
        throw new Error('Invalid credentials');
    }
});

//@desc Get user data
//@route GET /api/users/me
//@access private
const getMe = asyncHandler(async (req, res) => {
    const { _id, name, email, phone, club, role, company, cevent } = await User.findById(req.user.id);
    res.status(200).json({
        id: _id,
        name,
        email,
        phone,
        club,
        role,
        company,
        cevent,
        approved: req.user.approved,
                                     
    });
});

//@desc Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc Approve a user
// @route PUT /api/users/approve/:id
// @access Private (panel/registrar only)
const approveUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.approved = true;
    await user.save();

    res.status(200).json({ message: 'User approved successfully' });
});

module.exports = {
    registerUser,
    registerSponsor,
    loginUser,
    getMe,
    approveUser
};
