const express = require('express');
const router = express.Router();
const {
    getAllTrackers,
    getTrackerById,
    createTracker,
    updateTracker,
    deleteTracker,
    uploadDrawing,
    getVendorsForSelection,
    allocateVendor,
    upload
} = require('../controllers/mhDevelopmentTrackerController');

// Tracker CRUD routes
router.get('/', getAllTrackers);
router.get('/vendors', getVendorsForSelection);
router.get('/:id', getTrackerById);
router.post('/', createTracker);
router.put('/:id', updateTracker);
router.put('/:id/allocate-vendor', allocateVendor);
router.delete('/:id', deleteTracker);

// File upload route
router.post('/:id/upload-drawing', upload.single('drawing'), uploadDrawing);

module.exports = router;
