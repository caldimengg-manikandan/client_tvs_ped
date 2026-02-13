const MHDevelopmentTracker = require('../models/MHDevelopmentTracker');
const Vendor = require('../models/Vendor');
const VendorScoring = require('../models/VendorScoring');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/drawings';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'drawing-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, JPG, and PNG files are allowed'));
        }
    }
});

// Get all tracker records
const getAllTrackers = async (req, res) => {
    try {
        const trackers = await MHDevelopmentTracker.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: trackers,
            count: trackers.length
        });
    } catch (error) {
        console.error('Error fetching trackers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tracker records'
        });
    }
};

// Get single tracker record
const getTrackerById = async (req, res) => {
    try {
        const tracker = await MHDevelopmentTracker.findById(req.params.id);

        if (!tracker) {
            return res.status(404).json({
                success: false,
                message: 'Tracker record not found'
            });
        }

        res.status(200).json({
            success: true,
            data: tracker
        });
    } catch (error) {
        console.error('Error fetching tracker:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tracker record'
        });
    }
};

// Create new tracker record
const createTracker = async (req, res) => {
    try {
        const {
            departmentName,
            userName,
            assetRequestId,
            requestType,
            productModel,
            plantLocation,
            implementationTarget,
            status,
            currentStage,
            remarks
        } = req.body;

        // Validate required fields
        if (!departmentName || !userName || !assetRequestId || !requestType || !productModel || !plantLocation) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check for duplicate asset request ID
        const existingTracker = await MHDevelopmentTracker.findOne({ assetRequestId });
        if (existingTracker) {
            return res.status(400).json({
                success: false,
                message: 'Tracker record already exists for this Asset Request ID'
            });
        }

        const tracker = new MHDevelopmentTracker({
            departmentName,
            userName,
            assetRequestId,
            requestType,
            productModel,
            plantLocation,
            implementationTarget,
            status: status || 'Not Started',
            currentStage: currentStage || 'Not Started',
            remarks: remarks || ''
        });

        const savedTracker = await tracker.save();

        res.status(201).json({
            success: true,
            message: 'Tracker record created successfully',
            data: savedTracker
        });
    } catch (error) {
        console.error('Error creating tracker:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create tracker record'
        });
    }
};

// Update tracker record
const updateTracker = async (req, res) => {
    try {
        const tracker = await MHDevelopmentTracker.findById(req.params.id);

        if (!tracker) {
            return res.status(404).json({
                success: false,
                message: 'Tracker record not found'
            });
        }

        // Update fields
        const allowedUpdates = [
            'departmentName', 'userName', 'requestType', 'productModel', 'plantLocation',
            'vendorCode', 'vendorName', 'vendorLocation', 'vendorId',
            'projectPlan', 'implementationTarget', 'status', 'implementationVisibility',
            'currentStage', 'remarks'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                tracker[field] = req.body[field];
            }
        });

        const updatedTracker = await tracker.save();

        res.status(200).json({
            success: true,
            message: 'Tracker record updated successfully',
            data: updatedTracker
        });
    } catch (error) {
        console.error('Error updating tracker:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update tracker record'
        });
    }
};

// Delete tracker record
const deleteTracker = async (req, res) => {
    try {
        const tracker = await MHDevelopmentTracker.findById(req.params.id);

        if (!tracker) {
            return res.status(404).json({
                success: false,
                message: 'Tracker record not found'
            });
        }

        // Delete associated drawing file if exists
        if (tracker.drawingUrl) {
            const filePath = path.join(__dirname, '..', tracker.drawingUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await MHDevelopmentTracker.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Tracker record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting tracker:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete tracker record'
        });
    }
};

// Upload drawing
const uploadDrawing = async (req, res) => {
    try {
        const tracker = await MHDevelopmentTracker.findById(req.params.id);

        if (!tracker) {
            return res.status(404).json({
                success: false,
                message: 'Tracker record not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Delete old file if exists
        if (tracker.drawingUrl) {
            const oldFilePath = path.join(__dirname, '..', tracker.drawingUrl);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // Update tracker with new file info
        tracker.drawingUrl = req.file.path.replace(/\\/g, '/');
        tracker.drawingFileName = req.file.originalname;

        await tracker.save();

        res.status(200).json({
            success: true,
            message: 'Drawing uploaded successfully',
            data: {
                drawingUrl: tracker.drawingUrl,
                drawingFileName: tracker.drawingFileName
            }
        });
    } catch (error) {
        console.error('Error uploading drawing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload drawing'
        });
    }
};

// Get vendors for selection (from Vendor Scoring)
const getVendorsForSelection = async (req, res) => {
    try {
        // Get all vendors with their latest scores
        const vendors = await Vendor.find();

        // Get latest scores for each vendor
        const vendorsWithScores = await Promise.all(
            vendors.map(async (vendor) => {
                const latestScore = await VendorScoring.findOne({ vendorId: vendor._id })
                    .sort({ scoringYear: -1, scoringMonth: -1 })
                    .limit(1);

                return {
                    _id: vendor._id,
                    vendorCode: vendor.vendorCode,
                    vendorName: vendor.vendorName,
                    location: vendor.vendorLocation,
                    qcdScore: latestScore?.qcdScore || 0,
                    qsrScore: latestScore?.qsrScore || 0,
                    costScore: latestScore?.costScore || 0,
                    deliveryScore: latestScore?.deliveryScore || 0,
                    currentLoad: 0 // TODO: Calculate from active projects
                };
            })
        );

        // Sort by QCD score descending
        vendorsWithScores.sort((a, b) => b.qcdScore - a.qcdScore);

        res.status(200).json({
            success: true,
            data: vendorsWithScores,
            count: vendorsWithScores.length
        });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendors'
        });
    }
};

module.exports = {
    getAllTrackers,
    getTrackerById,
    createTracker,
    updateTracker,
    deleteTracker,
    uploadDrawing,
    getVendorsForSelection,
    upload
};
