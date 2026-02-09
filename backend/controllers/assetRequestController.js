const AssetRequest = require('../models/AssetRequest');

// @desc    Create a new asset request
// @route   POST /api/asset-request
// @access  Private
const createAssetRequest = async (req, res) => {
    try {
        const {
            departmentName,
            location,
            userName,
            requestType,
            category,
            problemStatement,
            handlingPartName,
            assetNeededLocation,
            assetName,
            poPrice,
            assetLocation
        } = req.body;

        // Generate ID: TVS + Location(3) + Dept(3) + Running Serial(4)
        const companyPrefix = "TVS";
        const locationPrefix = (location || "LOC").substring(0, 3).toUpperCase();
        const deptPrefix = (departmentName || "DEP").substring(0, 3).toUpperCase();
        const idPrefix = `${companyPrefix}${locationPrefix}${deptPrefix}`;

        // Find the last request with the same prefix to determine the next serial number
        const lastRequest = await AssetRequest.findOne({
            assetRequestId: { $regex: `^${idPrefix}` }
        }).sort({ assetRequestId: -1 });

        let nextSerial = 1;
        if (lastRequest && lastRequest.assetRequestId) {
            const lastSerial = parseInt(lastRequest.assetRequestId.slice(-4), 10);
            if (!isNaN(lastSerial)) {
                nextSerial = lastSerial + 1;
            }
        }

        const assetRequestId = `${idPrefix}${nextSerial.toString().padStart(4, '0')}`;

        const newRequest = new AssetRequest({
            assetRequestId,
            departmentName,
            location,
            userName,
            requestType,
            category,
            problemStatement,
            handlingPartName,
            assetNeededLocation,
            assetName,
            poPrice,
            assetLocation,
            drawingFile: req.file ? req.file.path.replace(/\\/g, "/") : null,
            user: req.user.id,
            history: [{
                action: 'Created',
                date: new Date(),
                details: `Request created by ${userName}`
            }]
        });

        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Get all active asset requests
// @route   GET /api/asset-request
// @access  Public
const getAllAssetRequests = async (req, res) => {
    try {
        const requests = await AssetRequest.find({ activeStatus: true })
            .populate('assignedVendor')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single asset request by ID
// @route   GET /api/asset-request/:id
// @access  Public
const getAssetRequestById = async (req, res) => {
    try {
        const request = await AssetRequest.findById(req.params.id).populate('assignedVendor');
        if (!request) return res.status(404).json({ message: 'Request not found' });
        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update asset request
// @route   PUT /api/asset-request/:id
// @access  Public
const updateAssetRequest = async (req, res) => {
    try {
        const {
            requestType,
            category,
            problemStatement,
            handlingPartName,
            assetNeededLocation,
            assignedVendor,
            status,
            designReceiptFromVendor,
            designApproval,
            production,
            implementation,
            remark,
            assetName,
            poPrice,
            assetLocation,
            drawingFile
        } = req.body;

        // Progress Status Logic: Sequential flow
        let progressStatus = 'Initial';
        let allocationAssetId = null;

        // FormData sends everything as strings, so we must parse booleans correctly
        const isImplementation = String(implementation) === 'true';
        const isProduction = String(production) === 'true';
        const isDesignApproval = String(designApproval) === 'true';
        const isDesignReceipt = String(designReceiptFromVendor) === 'true';

        if (isImplementation) {
            progressStatus = 'Implementation';
        } else if (isProduction) {
            progressStatus = 'Production';
        } else if (isDesignApproval) {
            progressStatus = 'Design Approved';
        } else if (isDesignReceipt) {
            progressStatus = 'Design';
        } else {
            progressStatus = 'Initial';
        }

        const existingRequest = await AssetRequest.findById(req.params.id);
        if (!existingRequest) return res.status(404).json({ message: 'Request not found' });

        // --- No Revoking Rules ---
        if (existingRequest.designReceiptFromVendor && !isDesignReceipt) {
            return res.status(400).json({ message: 'Cannot revoke Design Receipt once saved.' });
        }
        if (existingRequest.designApproval && !isDesignApproval) {
            return res.status(400).json({ message: 'Cannot revoke Design Approval once saved.' });
        }
        if (existingRequest.production && !isProduction) {
            return res.status(400).json({ message: 'Cannot revoke Production once saved.' });
        }
        if (existingRequest.implementation && !isImplementation) {
            return res.status(400).json({ message: 'Cannot revoke Implementation once saved.' });
        }

        // --- Vendor Validation on Production ---
        if (isProduction && (!assignedVendor || assignedVendor === 'null' || assignedVendor === '')) {
            return res.status(400).json({ message: 'Vendor must be assigned when allowing Production.' });
        }

        if (isProduction && !existingRequest.allocationAssetId) {
            allocationAssetId = `AST${existingRequest.assetRequestId}`;
        } else {
            allocationAssetId = existingRequest.allocationAssetId;
        }

        // Handle drawingFile redundancy and possible array value
        let currentDrawingFile = drawingFile;
        if (Array.isArray(drawingFile)) {
            currentDrawingFile = drawingFile.find(val => val !== 'null' && val !== '' && val !== null) || null;
        }

        // --- Construct Update Data ---
        let updateData = {};
        const fields = [
            'requestType', 'category', 'problemStatement', 'handlingPartName',
            'assetNeededLocation', 'status', 'remark', 'assetName', 'assetLocation'
        ];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Specialized fields
        updateData.designReceiptFromVendor = isDesignReceipt;
        updateData.designApproval = isDesignApproval;
        updateData.production = isProduction;
        updateData.implementation = isImplementation;
        updateData.progressStatus = progressStatus;
        updateData.allocationAssetId = allocationAssetId;

        // Vendor ID validation and cleanup
        if (assignedVendor === 'null' || assignedVendor === '' || !assignedVendor) {
            updateData.assignedVendor = null;
        } else {
            // If it's an object (populated), take the ID
            updateData.assignedVendor = typeof assignedVendor === 'object' ? assignedVendor._id : assignedVendor;

            // Basic ObjectId format validation to prevent 500 errors from Mongoose
            if (!/^[0-9a-fA-F]{24}$/.test(updateData.assignedVendor)) {
                return res.status(400).json({ message: 'Invalid Vendor ID format' });
            }
        }

        updateData.poPrice = (!poPrice || poPrice === 'null' || poPrice === '') ? null : Number(String(poPrice).replace(/[^0-9.-]/g, ''));

        if (req.file) {
            updateData.drawingFile = req.file.path.replace(/\\/g, "/");
        } else if (currentDrawingFile === 'null' || currentDrawingFile === null || currentDrawingFile === '') {
            updateData.drawingFile = null;
        } else if (currentDrawingFile !== undefined) {
            updateData.drawingFile = currentDrawingFile;
        }

        const updatedRequest = await AssetRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: updateData,
                $push: {
                    history: {
                        action: 'Updated',
                        date: new Date(),
                        details: 'Request details updated via tracker'
                    }
                }
            },
            { new: true, runValidators: true }
        ).populate('assignedVendor');

        res.json(updatedRequest);
    } catch (err) {
        console.error('Update Asset Request Error:', err);
        res.status(500).json({
            message: 'Internal Server Error during update',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// @desc    Soft delete asset request
// @route   DELETE /api/asset-request/:id
// @access  Public
const deleteAssetRequest = async (req, res) => {
    try {
        const deletedRequest = await AssetRequest.findByIdAndUpdate(
            req.params.id,
            {
                activeStatus: false,
                $push: {
                    history: {
                        action: 'Deleted',
                        date: new Date(),
                        details: 'Request soft deleted'
                    }
                }
            },
            { new: true }
        );

        if (!deletedRequest) return res.status(404).json({ message: 'Request not found' });

        res.json({ message: 'Request deleted successfully', id: req.params.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createAssetRequest,
    getAllAssetRequests,
    getAssetRequestById,
    updateAssetRequest,
    deleteAssetRequest
};
