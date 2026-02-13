const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/authMiddleware');
const vendorScoringController = require('../controllers/vendorScoringController');

// Apply protection to all routes
router.use(protect);

// Get all vendor scores
router.get('/', vendorScoringController.getVendorScores);

// Get vendor performance analytics (must come before :id route)
router.get('/analytics/:vendorId', vendorScoringController.getVendorPerformance);

// Bulk import
router.post('/bulk-import', checkPermission('vendorMaster'), vendorScoringController.bulkImportVendorScores);

// Get single vendor score
router.get('/:id', vendorScoringController.getVendorScoreById);

// Create new vendor score
router.post('/', checkPermission('vendorMaster'), vendorScoringController.createVendorScore);

// Update vendor score
router.put('/:id', checkPermission('vendorMaster'), vendorScoringController.updateVendorScore);

// Delete vendor score
router.delete('/:id', checkPermission('vendorMaster'), vendorScoringController.deleteVendorScore);

module.exports = router;
