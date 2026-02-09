const express = require('express');
const router = express.Router();
const { getActivityStats } = require('../controllers/userActivityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getActivityStats);

module.exports = router;
