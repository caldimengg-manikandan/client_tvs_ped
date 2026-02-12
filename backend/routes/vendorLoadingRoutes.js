const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/authMiddleware');
const {
    getVendorLoadingData,
    updateVendorLoading,
    bulkImportVendorLoading
} = require('../controllers/vendorLoadingController');

router.use(protect);

router.get('/', getVendorLoadingData);
router.post('/bulk-import', checkPermission('vendorMaster'), bulkImportVendorLoading);
router.put('/:id', checkPermission('vendorMaster'), updateVendorLoading);

module.exports = router;
