const MHRequest = require('../models/MHRequest');
const AssetManagement = require('../models/AssetManagement');
const MHDevelopmentTracker = require('../models/MHDevelopmentTracker');
const VendorScoring = require('../models/VendorScoring');
const User = require('../models/UserModel');

async function ensureMHDevelopmentTrackerForRequest(request, assetId) {
    if (!request || !request.mhRequestId) return;

    const basePayload = {
        departmentName: request.departmentName,
        userName: request.userName,
        assetRequestId: request.mhRequestId,
        requestType: request.requestType,
        productModel: request.productModel,
        plantLocation: request.plantLocation,
        implementationTarget: null,
        status: 'Not Started',
        currentStage: 'Not Started',
        remarks: ''
    };

    const update = {
        $setOnInsert: basePayload,
        $set: {
            materialHandlingEquipment: request.materialHandlingEquipment || ''
        }
    };

    if (assetId) {
        update.$set.assetId = assetId;
    } else {
        update.$setOnInsert.assetId = '';
    }

    await MHDevelopmentTracker.findOneAndUpdate(
        { assetRequestId: request.mhRequestId },
        update,
        { new: true, upsert: true }
    );
}

// @desc    Create a new MH request
// @route   POST /api/asset-request
// @access  Private
const createMHRequest = async (req, res) => {
    try {
        const data = req.body;

        // Sanitize incoming body for "null" strings from FormData
        const sanitizedData = {};
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (value === 'null' || value === 'undefined' || value === '') {
                sanitizedData[key] = null;
            } else {
                sanitizedData[key] = value;
            }
        });

        const {
            departmentName,
            location,
            userName,
            requestType,
            productModel,
            materialHandlingEquipment,
            problemStatement,
            handlingPartName,
            materialHandlingLocation,
            plantLocation,
            from,
            to,
            volumePerDay
        } = sanitizedData;

        // Validation for required fields
        const requiredFields = [
            'departmentName', 'location', 'userName', 'requestType',
            'productModel', 'problemStatement', 'handlingPartName',
            'materialHandlingLocation', 'plantLocation', 'from', 'to', 'volumePerDay'
        ];

        const missingFields = requiredFields.filter(field => !sanitizedData[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'Mandatory fields are missing',
                details: missingFields
            });
        }

        // Generate ID: TVS + FactoryLocCode(3) + DeptCode(3) + Running Serial(4)
        const companyPrefix = "TVS";

        const plantCodes = {
            'Hosur Plant 1 (TN)': 'HSR',
            'Hosur Plant 2 (TN)': 'HSR',
            'Hosur Plant 3 (TN)': 'HSR',
            'Mysore (KA)': 'MYS',
            'Mysore Plant (KA)': 'MYS',
            'Nalagarh (HP)': 'NAL',
            'Nalagarh Plant (HP)': 'NAL',
            'Karawang Plant (Indonesia)': 'IDN'
        };

        const locPart = plantCodes[plantLocation] || (plantLocation || location || "LOC").replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
        const deptPart = (departmentName || "DEP").replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();

        const idPrefix = `${companyPrefix}${locPart}${deptPart}`;

        // Find the last request with the same prefix to determine the next serial number
        const lastRequest = await MHRequest.findOne({
            mhRequestId: { $regex: `^${idPrefix}` }
        }).sort({ mhRequestId: -1 });

        let nextSerial = 1;
        if (lastRequest && lastRequest.mhRequestId) {
            const lastId = lastRequest.mhRequestId;
            const lastSerialStr = lastId.slice(-4);
            const lastSerial = parseInt(lastSerialStr, 10);
            if (!isNaN(lastSerial)) {
                nextSerial = lastSerial + 1;
            }
        }

        const mhRequestId = `${idPrefix}${nextSerial.toString().padStart(4, '0')}`;

        const newRequest = new MHRequest({
            mhRequestId,
            departmentName,
            location,
            userName,
            requestType,
            productModel,
            materialHandlingEquipment,
            problemStatement,
            handlingPartName,
            materialHandlingLocation,
            plantLocation,
            from,
            to,
            volumePerDay: Number(volumePerDay),
            mailId: sanitizedData.mailId || req.user.email,
            user: req.user.id,
            history: [{
                action: 'Created',
                date: new Date(),
                details: `MH Request created by ${userName}`
            }]
        });

        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        console.error('Create MH Request Error:', err);

        if (err.name === 'ValidationError') {
            const errors = err.errors || {};
            const messages = Object.values(errors)
                .map(e => e.message || (e.reason && e.reason.message) || '')
                .filter(Boolean);
            const message = messages[0] || 'Validation error while creating MH Request';
            return res.status(400).json({ message });
        }

        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid data provided for MH Request creation' });
        }

        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// @desc    Get all active MH requests
// @route   GET /api/asset-request
// @access  Public
const getAllMHRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { activeStatus: true };

        if (req.query.search) {
            filter.$or = [
                { mhRequestId: { $regex: req.query.search, $options: 'i' } },
                { departmentName: { $regex: req.query.search, $options: 'i' } },
                { productModel: { $regex: req.query.search, $options: 'i' } },
                { handlingPartName: { $regex: req.query.search, $options: 'i' } },
                { plantLocation: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const requests = await MHRequest.find(filter)
            .populate('assignedVendor')
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(limit);

        const total = await MHRequest.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            total,
            totalPages,
            currentPage: page,
            count: requests.length,
            data: requests
        });
    } catch (err) {
        console.error('Error in getAllMHRequests:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error while fetching MH Requests',
            error: err.message
        });
    }
};

// @desc    Get single MH request by ID
// @route   GET /api/asset-request/:id
// @access  Public
const getMHRequestById = async (req, res) => {
    try {
        const request = await MHRequest.findById(req.params.id).populate('assignedVendor');
        if (!request) return res.status(404).json({ message: 'Request not found' });
        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Generate Asset ID for an accepted MH request if missing
// @route   POST /api/asset-request/:id/generate-asset
// @access  Private
const generateAssetForRequest = async (req, res) => {
    try {
        let request = await MHRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'Accepted') {
            return res.status(400).json({
                message: 'Request must be Accepted before generating Asset ID.'
            });
        }

        if (request.allocationAssetId) {
            await ensureMHDevelopmentTrackerForRequest(request, request.allocationAssetId);
            return res.json(request);
        }

        const asset = await AssetManagement.create({
            vendorCode: 'AUTO',
            vendorName: 'Auto Generated',
            departmentName: request.departmentName,
            plantLocation: request.plantLocation,
            assetLocation: request.materialHandlingLocation || request.location,
            assetName: request.handlingPartName || request.productModel,
            createdBy: request.user

        });

        request.allocationAssetId = asset.assetId;
        request.progressStatus = 'Implementation';
        request.production = true;
        request.implementation = true;

        request.history.push({
            action: 'Updated',
            date: new Date(),
            details: `Final approval completed. Asset ${asset.assetId} created in Asset Master.`
        });

        await ensureMHDevelopmentTrackerForRequest(request, asset.assetId);

        request = await request.save();

        res.json(request);
    } catch (err) {
        console.error('Generate Asset For Request Error:', err);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// @desc    Update MH request
// @route   PUT /api/asset-request/:id
// @access  Public
const updateMHRequest = async (req, res) => {
    try {
        const {
            requestType,
            productModel,
            problemStatement,
            handlingPartName,
            materialHandlingEquipment,
            materialHandlingLocation,
            plantLocation,
            from,
            to,
            volumePerDay,
            assignedVendor,
            status,
            designReceiptFromVendor,
            designApproval,
            production,
            implementation,
            remark
        } = req.body;

        const existingRequest = await MHRequest.findById(req.params.id);
        if (!existingRequest) return res.status(404).json({ message: 'Request not found' });

        // ===== STATUS IMMUTABILITY VALIDATION =====
        // Once status is Accepted or Rejected, it cannot be changed
        if (status && existingRequest.status !== status) {
            // Check if current status is already finalized (Accepted or Rejected)
            if (existingRequest.status === 'Accepted') {
                return res.status(400).json({
                    message: 'Cannot modify status. Request has already been Accepted and is now immutable.',
                    currentStatus: existingRequest.status
                });
            }

            if (existingRequest.status === 'Rejected') {
                return res.status(400).json({
                    message: 'Cannot modify status. Request has already been Rejected and is now immutable.',
                    currentStatus: existingRequest.status
                });
            }

            // Only allow transition from Active to Accepted or Rejected
            if (existingRequest.status === 'Active') {
                if (status !== 'Accepted' && status !== 'Rejected') {
                    return res.status(400).json({
                        message: 'Invalid status transition. Status can only be changed from Active to Accepted or Rejected.',
                        currentStatus: existingRequest.status,
                        attemptedStatus: status
                    });
                }
            }
        }
        // ===== END STATUS VALIDATION =====

        // FormData sends everything as strings
        const isImplementation = String(implementation) === 'true';
        const isProduction = String(production) === 'true';
        const isDesignApproval = String(designApproval) === 'true';
        const isDesignReceipt = String(designReceiptFromVendor) === 'true';

        let progressStatus = existingRequest.progressStatus;
        if (isImplementation) progressStatus = 'Implementation';
        else if (isProduction) progressStatus = 'Production';
        else if (isDesignApproval) progressStatus = 'Design Approved';
        else if (isDesignReceipt) progressStatus = 'Design';
        else progressStatus = 'Initial';

        // Build Update Data with safe fallbacks so required fields are never unset
        const updateData = {
            requestType: requestType ?? existingRequest.requestType,
            productModel: productModel ?? existingRequest.productModel,
            problemStatement: problemStatement ?? existingRequest.problemStatement,
            handlingPartName: handlingPartName ?? existingRequest.handlingPartName,
            materialHandlingEquipment: materialHandlingEquipment ?? existingRequest.materialHandlingEquipment,
            materialHandlingLocation: materialHandlingLocation ?? existingRequest.materialHandlingLocation,
            plantLocation: plantLocation ?? existingRequest.plantLocation,
            from: from ?? existingRequest.from,
            to: to ?? existingRequest.to,
            volumePerDay: volumePerDay ? Number(volumePerDay) : existingRequest.volumePerDay,
            status: status || existingRequest.status,
            remark: remark ?? existingRequest.remark,
            designReceiptFromVendor: isDesignReceipt,
            designApproval: isDesignApproval,
            production: isProduction,
            implementation: isImplementation,
            progressStatus,
            allocationAssetId: existingRequest.allocationAssetId
        };

        // Vendor cleanup
        if (assignedVendor === 'null' || assignedVendor === '' || !assignedVendor) {
            updateData.assignedVendor = null;
        } else {
            updateData.assignedVendor = typeof assignedVendor === 'object' ? assignedVendor._id : assignedVendor;
        }

        let updatedRequest = await MHRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: updateData,
                $push: {
                    history: {
                        action: 'Updated',
                        date: new Date(),
                        details: status && existingRequest.status !== status
                            ? `Status changed from ${existingRequest.status} to ${status}`
                            : 'MH Request details updated'
                    }
                }
            },
            { new: true, runValidators: true }
        ).populate('assignedVendor');

        if (!updatedRequest) {
            return res.status(404).json({ message: 'Request not found after update' });
        }

        if (updatedRequest.status === 'Accepted') {
            await ensureMHDevelopmentTrackerForRequest(updatedRequest, updatedRequest.allocationAssetId);
        }

        if (updatedRequest.status === 'Accepted' && !updatedRequest.allocationAssetId) {
            const asset = await AssetManagement.create({
                vendorCode: 'AUTO',
                vendorName: 'Auto Generated',
                departmentName: updatedRequest.departmentName,
                plantLocation: updatedRequest.plantLocation,
                assetLocation: updatedRequest.materialHandlingLocation || updatedRequest.location,
                assetName: updatedRequest.handlingPartName || updatedRequest.productModel,
                createdBy: updatedRequest.user
            });

            updatedRequest.allocationAssetId = asset.assetId;
            updatedRequest.progressStatus = 'Implementation';
            updatedRequest.production = true;
            updatedRequest.implementation = true;

            updatedRequest.history.push({
                action: 'Updated',
                date: new Date(),
                details: `Final approval completed. Asset ${asset.assetId} created in Asset Master.`
            });

            await ensureMHDevelopmentTrackerForRequest(updatedRequest, asset.assetId);

            await updatedRequest.save();
        }

        res.json(updatedRequest);
    } catch (err) {
        console.error('Update MH Request Error:', err);

        if (err.name === 'ValidationError') {
            const errors = err.errors || {};
            const messages = Object.values(errors)
                .map(e => e.message || (e.reason && e.reason.message) || '')
                .filter(Boolean);
            const message = messages[0] || 'Validation error while updating MH Request';
            return res.status(400).json({ message });
        }

        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid data provided for MH Request update' });
        }

        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};


// @desc    Soft delete MH request
// @route   DELETE /api/asset-request/:id
// @access  Public
const deleteMHRequest = async (req, res) => {
    try {
        const deletedRequest = await MHRequest.findByIdAndUpdate(
            req.params.id,
            {
                activeStatus: false,
                $push: {
                    history: {
                        action: 'Deleted',
                        date: new Date(),
                        details: 'MH Request soft deleted'
                    }
                }
            },
            { new: true }
        );

        if (!deletedRequest) return res.status(404).json({ message: 'Request not found' });

        res.json({ message: 'Request deleted successfully', id: req.params.id });
    } catch (err) {
        console.error('Delete MH Request Error:', err);

        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid MH Request ID for deletion' });
        }

        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

module.exports = {
    createMHRequest,
    getAllMHRequests,
    getMHRequestById,
    updateMHRequest,
    deleteMHRequest,
    generateAssetForRequest
};
