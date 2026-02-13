const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, checkPermission } = require('../middleware/authMiddleware');
const assetManagementController = require('../controllers/assetManagementController');

// Ensure upload directory exists
const uploadDir = 'uploads/AssetManagement/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Sign-off document: PDF, Word
    // Drawing: PNG, JPG, JPEG, WEBP, PDF, Word
    const signOffFormats = /\.(pdf|doc|docx)$/i;
    const drawingFormats = /\.(png|jpg|jpeg|webp|pdf|doc|docx)$/i;

    if (file.fieldname === 'signOffDocument') {
        if (!signOffFormats.test(file.originalname)) {
            return cb(new Error('Sign-off document must be PDF or Word format'), false);
        }
    } else if (file.fieldname === 'drawing') {
        if (!drawingFormats.test(file.originalname)) {
            return cb(new Error('Drawing must be PNG, JPG, JPEG, WEBP, PDF, or Word format'), false);
        }
    }

    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// File upload fields
const uploadFields = upload.fields([
    { name: 'signOffDocument', maxCount: 1 },
    { name: 'drawing', maxCount: 1 }
]);

// Apply protection to all routes
router.use(protect);

// Helper routes (should be before parameterized routes)
router.get('/vendors/list', assetManagementController.getVendors);
router.get('/departments/list', assetManagementController.getDepartments);

// @route   GET /api/asset-management
// @desc    Get all asset management records
// @access  Private
router.get('/', assetManagementController.getAllAssets);

// @route   POST /api/asset-management
// @desc    Create new asset
// @access  Private (requires assetSummary permission)
router.post('/', checkPermission('assetSummary'), uploadFields, assetManagementController.createAsset);

// @route   GET /api/asset-management/:id
// @desc    Get single asset by ID
// @access  Private
router.get('/:id', assetManagementController.getAssetById);

// @route   PUT /api/asset-management/:id
// @desc    Update asset
// @access  Private (requires assetSummary permission)
router.put('/:id', checkPermission('assetSummary'), uploadFields, assetManagementController.updateAsset);

// @route   DELETE /api/asset-management/:id/file/:fileType
// @desc    Delete asset file (signOffDocument or drawing)
// @access  Private (requires assetSummary permission)
router.delete('/:id/file/:fileType', checkPermission('assetSummary'), assetManagementController.deleteAssetFile);

// @route   DELETE /api/asset-management/:id
// @desc    Delete asset
// @access  Private (requires assetSummary permission)
router.delete('/:id', checkPermission('assetSummary'), assetManagementController.deleteAsset);

// Error handling middleware for Multer
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size exceeds 10MB limit' });
        }
        return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err.message.includes('must be')) {
        return res.status(400).json({ message: err.message });
    }
    next(err);
});

module.exports = router;
