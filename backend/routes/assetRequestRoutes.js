const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, checkPermission } = require('../middleware/authMiddleware');
const assetRequestController = require('../controllers/assetRequestController');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/AssetRequest/');
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// Apply protection to all routes
router.use(protect);

// @route   POST /api/asset-request
// @desc    Create a new asset request
// @access  Private
router.post('/', protect, checkPermission('assetRequest'), upload.single('drawingFile'), assetRequestController.createAssetRequest);

// @route   GET /api/asset-request
// @desc    Get all active asset requests
// @access  Public
router.get('/', assetRequestController.getAllAssetRequests);

// @route   GET /api/asset-request/:id
// @desc    Get single asset request by ID
// @access  Public
router.get('/:id', assetRequestController.getAssetRequestById);

// @route   PUT /api/asset-request/:id
// @desc    Update asset request
// @access  Public
router.put('/:id', upload.single('drawingFile'), assetRequestController.updateAssetRequest);

// @route   DELETE /api/asset-request/:id
// @desc    Soft delete asset request
// @access  Public
router.delete('/:id', assetRequestController.deleteAssetRequest);

// Error handling middleware for Multer
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({ message: err.message });
    }
    next(err);
});

module.exports = router;
