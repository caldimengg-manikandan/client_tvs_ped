const express = require('express');
const router = express.Router();
const { sendRequestEmail } = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware');

// Using protect middleware if authentication is required, or remove if public
// Based on frontend call, users are logged in, so protect assumes a valid token.
// The user request didn't specify auth, but it's safe to protect it.
router.post('/send', protect, sendRequestEmail);

module.exports = router;
