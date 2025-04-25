const asyncHandler = require('express-async-handler');
const Announcement = require('../models/announcementModel');
const Opportunity = require('../models/opportunityModel');

// @desc    Create an announcement
// @route   POST /api/announcements
// @access  Private (Panel only)
const createAnnouncement = asyncHandler(async (req, res) => {
  const { eventId, message } = req.body;

  if (!eventId || !message) {
    res.status(400);
    throw new Error('Event ID and message are required');
  }

  const announcement = await Announcement.create({
    eventId,
    message,
    createdBy: req.user.id,
  });

  res.status(201).json(announcement);
});

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = asyncHandler(async (req, res) => {
    const announcements = await Announcement.find()
        .populate({
            path: 'eventId',
            select: 'name date location'
        })
        .sort({ createdAt: -1 });

    res.status(200).json(announcements);
});

module.exports = {
    createAnnouncement,
    getAnnouncements,
};
