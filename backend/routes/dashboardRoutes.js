const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/authMiddleware');
const {
    getStats,
    getRecentActivity,
    getTrends,
    fixDataDates
} = require('../controllers/dashboardController');

// Apply protection and permission check to all dashboard routes
router.use(protect);
router.use(checkPermission('dashboard'));

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', getStats);

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activity/requests
// @access  Private
router.get('/recent-activity', getRecentActivity);

// @route   GET /api/dashboard/trends
// @desc    Get trend data for charts with optional date range
// @access  Private
router.get('/trends', getTrends);

// @route   GET /api/dashboard/fix-data-dates
// @desc    Helper to update old records to current date for visibility
// @access  Private
router.get('/fix-data-dates', fixDataDates);

module.exports = router;
