const express = require('express');
const router = express.Router();
const { sendRequestEmail, testSMTPConnection } = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware');

// Diagnostic test route to verify SMTP configuration
router.post('/test-connection', protect, testSMTPConnection);

router.post('/send', protect, sendRequestEmail);

module.exports = router;
