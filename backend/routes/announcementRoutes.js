const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Announcement = require('../models/announcementModel');
const {
  createAnnouncement,
  getAnnouncements,
} = require('../controllers/announcementController');

// Create an announcement (Panel only)
router.post('/', protect, authorize('panel'), createAnnouncement);

// Fetch all announcements
router.get('/', protect, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

// Get announcements for an event (All roles)
router.get('/:eventId', protect, getAnnouncements);

module.exports = router;
