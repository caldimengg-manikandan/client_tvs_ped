const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/authMiddleware');
const {
    getVendorScores,
    createVendorScore,
    updateVendorScore,
    deleteVendorScore,
    bulkImportVendorScores
} = require('../controllers/vendorScoringController');

router.use(protect);

router.get('/', getVendorScores);
router.post('/bulk-import', checkPermission('vendorMaster'), bulkImportVendorScores);
router.post('/', checkPermission('vendorMaster'), createVendorScore);
router.put('/:id', checkPermission('vendorMaster'), updateVendorScore);
router.delete('/:id', checkPermission('vendorMaster'), deleteVendorScore);

module.exports = router;
