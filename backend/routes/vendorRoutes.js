const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/authMiddleware');
const vendorController = require('../controllers/vendorController');

// Apply protection to all routes
router.use(protect);

// Get all vendors
router.get('/', vendorController.getAllVendors);

// Get next vendor ID (must come before :id route)
router.get('/next-id', vendorController.getNextVendorId);

// Get single vendor
router.get('/:id', vendorController.getVendorById);

// Create new vendor
router.post('/', checkPermission('vendorMaster'), vendorController.createVendor);

// Update vendor
router.put('/:id', checkPermission('vendorMaster'), vendorController.updateVendor);

// Delete vendor
router.delete('/:id', checkPermission('vendorMaster'), vendorController.deleteVendor);

module.exports = router;
