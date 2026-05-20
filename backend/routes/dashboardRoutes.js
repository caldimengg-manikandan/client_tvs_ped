const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/authMiddleware');
const {
    getStats,
    getRecentActivity,
    getTrends,
    fixDataDates,
    getDashboardData,
    dashboardPhaseItems
} = require('../controllers/dashboardController');

router.use(protect);
router.use(checkPermission('dashboard'));

// Unified dashboard data endpoint
router.get('/', getDashboardData);

// Legacy endpoints (keep for backward compatibility)
router.get('/stats', getStats);
router.get('/recent-activity', getRecentActivity);
router.get('/trends', getTrends);
router.get('/fix-data-dates', fixDataDates);
router.get('/phase-items', dashboardPhaseItems);

module.exports = router;
