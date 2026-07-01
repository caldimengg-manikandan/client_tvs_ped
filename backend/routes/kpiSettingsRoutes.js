const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/kpiSettingsController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getSettings)
    .put(protect, checkPermission('settings'), updateSettings);

module.exports = router;
