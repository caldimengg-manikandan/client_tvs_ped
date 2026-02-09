const express = require('express');
const router = express.Router();
const {
    getReportSettings,
    saveReportSettings,
    previewReport,
    sendReportNow,
    deleteReportSettings
} = require('../controllers/reportSettingsController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// @route   GET /api/report-settings
// @desc    Get current report settings
router.get('/', getReportSettings);

// @route   POST /api/report-settings
// @desc    Save/Update report settings
router.post('/', saveReportSettings);

// @route   POST /api/report-settings/preview
// @desc    Generate and preview report
router.post('/preview', previewReport);

// @route   POST /api/report-settings/send-now
// @desc    Send report immediately
router.post('/send-now', sendReportNow);

// @route   DELETE /api/report-settings
// @desc    Delete/Deactivate report settings
router.delete('/', deleteReportSettings);

module.exports = router;
