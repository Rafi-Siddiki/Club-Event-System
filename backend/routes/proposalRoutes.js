const express = require('express');
const router = express.Router();
const { getProposals, updateProposal, getProposalById, createProposal } = require('../controllers/proposalController');
const { protect } = require('../middleware/authMiddleware');

// Routes for proposals
router.get('/', protect, getProposals);
router.get('/:id', protect, getProposalById);
router.put('/:id', protect, updateProposal);
router.post('/', protect, createProposal);

module.exports = router;