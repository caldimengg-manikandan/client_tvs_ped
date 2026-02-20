const AssetManagement = require('../models/AssetManagement');
const VendorScoring = require('../models/VendorScoring');
const Employee = require('../models/EmployeeModel');
const fs = require('fs').promises;
const path = require('path');

// @desc    Get all asset management records
// @route   GET /api/asset-management
// @access  Private
const getAllAssets = async (req, res) => {
    try {
        const assets = await AssetManagement.find()
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(assets);
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ message: 'Server error while fetching assets' });
    }
};

// @desc    Get single asset by ID
// @route   GET /api/asset-management/:id
// @access  Private
const getAssetById = async (req, res) => {
    try {
        const asset = await AssetManagement.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        res.json(asset);
    } catch (error) {
        console.error('Error fetching asset:', error);
        res.status(500).json({ message: 'Server error while fetching asset' });
    }
};

// @desc    Create new asset
// @route   POST /api/asset-management
// @access  Private
const createAsset = async (req, res) => {
    try {
        const {
            vendorCode,
            vendorName,
            departmentName,
            plantLocation,
            assetLocation,
            assetName
        } = req.body;

        // Validate required fields
        if (!vendorCode || !vendorName || !departmentName || !plantLocation || !assetLocation || !assetName) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Verify vendor exists in VendorScoring
        const vendor = await VendorScoring.findOne({ vendorCode });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found in Vendor Scoring' });
        }

        // Verify department exists in Employee Master
        const employeeWithDept = await Employee.findOne({ departmentName });
        if (!employeeWithDept) {
            return res.status(404).json({ message: 'Department not found in Employee Master' });
        }

        const assetData = {
            vendorCode,
            vendorName,
            departmentName,
            plantLocation,
            assetLocation,
            assetName,
            createdBy: req.user?._id
        };

        // Handle file uploads
        if (req.files) {
            if (req.files.signOffDocument) {
                assetData.signOffDocument = {
                    filename: req.files.signOffDocument[0].filename,
                    path: req.files.signOffDocument[0].path,
                    uploadDate: new Date()
                };
            }
            if (req.files.drawing) {
                assetData.drawing = {
                    filename: req.files.drawing[0].filename,
                    path: req.files.drawing[0].path,
                    uploadDate: new Date()
                };
            }
        }

        const asset = await AssetManagement.create(assetData);

        res.status(201).json(asset);
    } catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({ message: 'Server error while creating asset', error: error.message });
    }
};

// @desc    Update asset
// @route   PUT /api/asset-management/:id
// @access  Private
const updateAsset = async (req, res) => {
    try {
        const asset = await AssetManagement.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        const {
            vendorCode,
            vendorName,
            departmentName,
            plantLocation,
            assetLocation,
            assetName
        } = req.body;

        // Update basic fields
        if (vendorCode) asset.vendorCode = vendorCode;
        if (vendorName) asset.vendorName = vendorName;
        if (departmentName) asset.departmentName = departmentName;
        if (plantLocation) asset.plantLocation = plantLocation;
        if (assetLocation) asset.assetLocation = assetLocation;
        if (assetName) asset.assetName = assetName;
        asset.updatedBy = req.user?._id;

        // Handle file uploads
        if (req.files) {
            if (req.files.signOffDocument) {
                // Delete old file if exists
                if (asset.signOffDocument?.path) {
                    try {
                        await fs.unlink(asset.signOffDocument.path);
                    } catch (err) {
                        console.error('Error deleting old sign-off document:', err);
                    }
                }
                asset.signOffDocument = {
                    filename: req.files.signOffDocument[0].filename,
                    path: req.files.signOffDocument[0].path,
                    uploadDate: new Date()
                };
            }
            if (req.files.drawing) {
                // Delete old file if exists
                if (asset.drawing?.path) {
                    try {
                        await fs.unlink(asset.drawing.path);
                    } catch (err) {
                        console.error('Error deleting old drawing:', err);
                    }
                }
                asset.drawing = {
                    filename: req.files.drawing[0].filename,
                    path: req.files.drawing[0].path,
                    uploadDate: new Date()
                };
            }
        }

        const updatedAsset = await asset.save();

        res.json(updatedAsset);
    } catch (error) {
        console.error('Error updating asset:', error);
        res.status(500).json({ message: 'Server error while updating asset', error: error.message });
    }
};

// @desc    Delete asset file (sign-off or drawing)
// @route   DELETE /api/asset-management/:id/file/:fileType
// @access  Private
const deleteAssetFile = async (req, res) => {
    try {
        const { id, fileType } = req.params;

        if (fileType !== 'signOffDocument' && fileType !== 'drawing') {
            return res.status(400).json({ message: 'Invalid file type' });
        }

        const asset = await AssetManagement.findById(id);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        if (!asset[fileType]) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Delete physical file
        try {
            await fs.unlink(asset[fileType].path);
        } catch (err) {
            console.error('Error deleting file:', err);
        }

        // Remove file reference from database
        asset[fileType] = undefined;
        asset.updatedBy = req.user?._id;
        await asset.save();

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Server error while deleting file' });
    }
};

// @desc    Delete asset
// @route   DELETE /api/asset-management/:id
// @access  Private
const deleteAsset = async (req, res) => {
    try {
        const asset = await AssetManagement.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Delete associated files
        if (asset.signOffDocument?.path) {
            try {
                await fs.unlink(asset.signOffDocument.path);
            } catch (err) {
                console.error('Error deleting sign-off document:', err);
            }
        }
        if (asset.drawing?.path) {
            try {
                await fs.unlink(asset.drawing.path);
            } catch (err) {
                console.error('Error deleting drawing:', err);
            }
        }

        await AssetManagement.findByIdAndDelete(req.params.id);

        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ message: 'Server error while deleting asset' });
    }
};

// @desc    Get vendors from VendorScoring (deduplicated by vendorCode)
// @route   GET /api/asset-management/vendors/list
// @access  Private
const getVendors = async (req, res) => {
    try {
        // Use aggregation to get one unique entry per vendorCode
        const vendors = await VendorScoring.aggregate([
            {
                $group: {
                    _id: '$vendorCode',
                    vendorCode: { $first: '$vendorCode' },
                    vendorName: { $first: '$vendorName' },
                    location: { $first: '$location' }
                }
            },
            { $sort: { vendorName: 1 } }
        ]);
        res.json(vendors);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ message: 'Server error while fetching vendors' });
    }
};

// @desc    Get departments from Employee Master
// @route   GET /api/asset-management/departments/list
// @access  Private
const getDepartments = async (req, res) => {
    try {
        const departments = await Employee.distinct('departmentName');
        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ message: 'Server error while fetching departments' });
    }
};

module.exports = {
    getAllAssets,
    getAssetById,
    createAsset,
    updateAsset,
    deleteAssetFile,
    deleteAsset,
    getVendors,
    getDepartments
};
